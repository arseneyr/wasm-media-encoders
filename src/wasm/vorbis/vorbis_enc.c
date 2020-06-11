#include <vorbis/vorbisenc.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>
#include <stdbool.h>

#define DEFAULT_OGG_BUFFER_SIZE (1024 * 1024)

typedef struct _CFG
{
  unsigned char *ogg_buffer;
  unsigned int ogg_buffer_size;
  vorbis_info vi;
  vorbis_dsp_state vd;
  vorbis_block vb;
  ogg_stream_state os;
} CFG, *PCFG;

typedef struct _PARAMS
{
  float vbr_quality;
} PARAMS, *PPARAMS;

int write_blocks(PCFG cfg, unsigned int previous_offset);
int stream_write(PCFG cfg, unsigned int previous_offset, bool flush);

float **enc_get_pcm(PCFG cfg, unsigned int num_samples)
{
  return vorbis_analysis_buffer(&cfg->vd, num_samples);
}

unsigned char *enc_get_out_buf(PCFG cfg)
{
  return cfg->ogg_buffer;
}

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

  srand(time(NULL));
  ogg_stream_init(&cfg->os, rand());
  vorbis_analysis_init(&cfg->vd, &cfg->vi);
  vorbis_block_init(&cfg->vd, &cfg->vb);

  cfg->ogg_buffer_size = DEFAULT_OGG_BUFFER_SIZE;
  cfg->ogg_buffer = malloc(cfg->ogg_buffer_size);
  if (cfg->ogg_buffer == NULL)
  {
    goto Cleanup;
  }

  return cfg;

Cleanup:
  enc_free(cfg);
  return NULL;
}

int enc_encode(PCFG cfg, unsigned int num_samples)
{
  unsigned int offset = 0;
  ogg_packet header;
  ogg_packet header_comm;
  ogg_packet header_code;
  vorbis_comment vc;

  if (cfg->os.b_o_s == 0)
  {
    vorbis_comment_init(&vc);
    vorbis_analysis_headerout(&cfg->vd, &vc, &header, &header_comm, &header_code);

    // According to https://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-132000A.2 the first packet
    // must be on its own page and audio data (after the third packet) must begin on a fresh page
    ogg_stream_packetin(&cfg->os, &header);
    offset = stream_write(cfg, offset, true);

    ogg_stream_packetin(&cfg->os, &header_comm);
    ogg_stream_packetin(&cfg->os, &header_code);
    offset = stream_write(cfg, offset, true);
  }

  vorbis_analysis_wrote(&cfg->vd, num_samples);

  return write_blocks(cfg, offset);
}

int enc_flush(PCFG cfg)
{
  vorbis_analysis_wrote(&cfg->vd, 0);
  return write_blocks(cfg, 0);
}

int write_blocks(PCFG cfg, unsigned int previous_offset)
{
  unsigned int offset = previous_offset;
  ogg_packet packet;

  while (vorbis_analysis_blockout(&cfg->vd, &cfg->vb) == 1)
  {
    vorbis_analysis(&cfg->vb, &packet);
    ogg_stream_packetin(&cfg->os, &packet);
    offset = stream_write(cfg, offset, false);
  }
  return offset;
}

int stream_write(PCFG cfg, unsigned int previous_offset, bool flush)
{
  unsigned int offset = previous_offset;
  ogg_page page;

  while ((flush ? ogg_stream_flush(&cfg->os, &page) : ogg_stream_pageout(&cfg->os, &page)) != 0)
  {
    while (cfg->ogg_buffer_size < (offset + page.header_len + page.body_len))
    {
      cfg->ogg_buffer_size *= 2;
      cfg->ogg_buffer = realloc(cfg->ogg_buffer, cfg->ogg_buffer_size);
    }
    memcpy(cfg->ogg_buffer + offset, page.header, page.header_len);
    offset += page.header_len;
    memcpy(cfg->ogg_buffer + offset, page.body, page.body_len);
    offset += page.body_len;
  }

  return offset;
}