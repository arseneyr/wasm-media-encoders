#include <vorbis/vorbisenc.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <emscripten.h>

#define DEFAULT_OGG_BUFFER_SIZE (1024 * 1024)
#define WROTE_BUFFER_STEP_SIZE (1024 * 64)
#define MIN(x, y) (((x) < (y)) ? (x) : (y))

typedef struct _CFG
{
  unsigned char *ogg_buffer;
  unsigned int ogg_buffer_size;
  unsigned int ogg_buffer_offset;
  vorbis_info vi;
  vorbis_dsp_state vd;
  vorbis_block vb;
  ogg_stream_state os;
} CFG, *PCFG;

typedef struct _PARAMS
{
  float vbr_quality;
  int serialno;

} PARAMS, *PPARAMS;

void write_blocks(PCFG cfg);
void stream_write(PCFG cfg, bool flush);

EMSCRIPTEN_KEEPALIVE
float **enc_get_pcm(PCFG cfg, unsigned int num_samples)
{
  return vorbis_analysis_buffer(&cfg->vd, num_samples);
}

EMSCRIPTEN_KEEPALIVE
unsigned char *enc_get_out_buf(PCFG cfg)
{
  return cfg->ogg_buffer;
}

EMSCRIPTEN_KEEPALIVE
void enc_free(PCFG cfg)
{
  if (cfg)
  {
    vorbis_info_clear(&cfg->vi);
    ogg_stream_clear(&cfg->os);
    vorbis_dsp_clear(&cfg->vd);
    vorbis_block_clear(&cfg->vb);
    if (cfg->ogg_buffer)
    {
      free(cfg->ogg_buffer);
    }
    free(cfg);
  }
}

EMSCRIPTEN_KEEPALIVE
PCFG enc_init(unsigned int sample_rate,
              unsigned int channel_count,
              PPARAMS params)
{
  PCFG cfg = NULL;

  if (channel_count > 2)
  {
    goto Cleanup;
  }

  cfg = calloc(1, sizeof(CFG));
  if (!cfg)
  {
    goto Cleanup;
  }

  vorbis_info_init(&cfg->vi);
  if (vorbis_encode_init_vbr(&cfg->vi, channel_count, sample_rate, params->vbr_quality * 0.1) < 0)
  {
    goto Cleanup;
  }

  ogg_stream_init(&cfg->os, params->serialno);
  vorbis_analysis_init(&cfg->vd, &cfg->vi);
  vorbis_block_init(&cfg->vd, &cfg->vb);

  cfg->ogg_buffer_size = DEFAULT_OGG_BUFFER_SIZE;
  cfg->ogg_buffer = malloc(cfg->ogg_buffer_size);
  if (cfg->ogg_buffer == NULL)
  {
    goto Cleanup;
  }
  {
    ogg_packet header;
    ogg_packet header_comm;
    ogg_packet header_code;
    vorbis_comment vc;
    vorbis_comment_init(&vc);
    vorbis_analysis_headerout(&cfg->vd, &vc, &header, &header_comm, &header_code);

    // According to https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-132000A.2 the first packet
    // must be on its own page and audio data (after the third packet) must begin on a fresh page
    ogg_stream_packetin(&cfg->os, &header);
    stream_write(cfg, true);

    ogg_stream_packetin(&cfg->os, &header_comm);
    ogg_stream_packetin(&cfg->os, &header_code);
    stream_write(cfg, true);
  }

  return cfg;

Cleanup:
  enc_free(cfg);
  return NULL;
}

EMSCRIPTEN_KEEPALIVE
int enc_encode(PCFG cfg, unsigned int num_samples)
{
  unsigned int ret = 0;
  unsigned int current_sample = 0;

  while (current_sample < num_samples)
  {
    // This function could allocate on order num_samples
    // of stack space in _preextrapolate_helper.
    vorbis_analysis_wrote(&cfg->vd, MIN(WROTE_BUFFER_STEP_SIZE, num_samples - current_sample));
    current_sample += WROTE_BUFFER_STEP_SIZE;
  }

  write_blocks(cfg);
  ret = cfg->ogg_buffer_offset;
  cfg->ogg_buffer_offset = 0;
  return ret;
}

EMSCRIPTEN_KEEPALIVE
int enc_flush(PCFG cfg)
{
  vorbis_analysis_wrote(&cfg->vd, 0);
  write_blocks(cfg);
  return cfg->ogg_buffer_offset;
}

void write_blocks(PCFG cfg)
{
  ogg_packet packet;

  while (vorbis_analysis_blockout(&cfg->vd, &cfg->vb) == 1)
  {
    vorbis_analysis(&cfg->vb, &packet);
    ogg_stream_packetin(&cfg->os, &packet);
    stream_write(cfg, false);
  }
}

void stream_write(PCFG cfg, bool flush)
{
  ogg_page page;

  while ((flush ? ogg_stream_flush(&cfg->os, &page) : ogg_stream_pageout(&cfg->os, &page)) != 0)
  {
    while (cfg->ogg_buffer_size < (cfg->ogg_buffer_offset + page.header_len + page.body_len))
    {
      cfg->ogg_buffer_size *= 2;
      cfg->ogg_buffer = realloc(cfg->ogg_buffer, cfg->ogg_buffer_size);
    }
    memcpy(cfg->ogg_buffer + cfg->ogg_buffer_offset, page.header, page.header_len);
    cfg->ogg_buffer_offset += page.header_len;
    memcpy(cfg->ogg_buffer + cfg->ogg_buffer_offset, page.body, page.body_len);
    cfg->ogg_buffer_offset += page.body_len;
  }
}