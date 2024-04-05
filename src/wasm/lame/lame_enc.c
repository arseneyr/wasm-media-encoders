#include <lame/lame.h>
#include <stdlib.h>
#include <emscripten.h>
#include "../common_params.h"

// 30 seconds of audio at 48kHz
#define MP3_BUFFER_SIZE(num_samples) (1.25 * (num_samples) + 7200)
#define DEFAULT_MP3_SIZE MP3_BUFFER_SIZE(48000 * 30)
#define DEFAULT_PCM_SAMPLE_COUNT 128

typedef struct _CFG
{
  float *pcm;
  float *pcm_ret[2];
  unsigned int pcm_sample_count;
  unsigned int channel_count;
  unsigned char *mp3_buffer;
  unsigned int mp3_buffer_size;
  lame_global_flags *gfp;
} CFG, *PCFG;

typedef struct __attribute__((packed)) _PARAMS
{
  COMMON_PARAMS c;
  unsigned int bitrate;
  float vbr_quality;
} PARAMS, *PPARAMS;

EMSCRIPTEN_KEEPALIVE
float **enc_get_pcm(PCFG cfg, unsigned int num_samples)
{
  if (num_samples * cfg->channel_count > cfg->pcm_sample_count)
  {
    cfg->pcm_sample_count = num_samples * cfg->channel_count * 2;
    cfg->pcm = realloc(cfg->pcm, cfg->pcm_sample_count * sizeof(*cfg->pcm));
    if (!cfg->pcm)
    {
      return NULL;
    }
    cfg->pcm_ret[0] = cfg->pcm;
    cfg->pcm_ret[1] = cfg->pcm + cfg->pcm_sample_count / 2;
  }

  return cfg->pcm_ret;
}

EMSCRIPTEN_KEEPALIVE
unsigned char *enc_get_out_buf(PCFG cfg)
{
  return cfg->mp3_buffer;
}

EMSCRIPTEN_KEEPALIVE
void enc_free(PCFG cfg)
{
  if (cfg)
  {
    if (cfg->gfp)
    {
      lame_close(cfg->gfp);
    }
    if (cfg->pcm)
    {
      free(cfg->pcm);
    }
    if (cfg->mp3_buffer)
    {
      free(cfg->mp3_buffer);
    }
    free(cfg);
  }
}

EMSCRIPTEN_KEEPALIVE
PCFG enc_init(PPARAMS params)
{
  PCFG cfg = NULL;
  if (params->c.in_channel_count > 2 || (params->vbr_quality < 0) == (params->bitrate == 0))
  {
    goto Cleanup;
  }

  cfg = calloc(1, sizeof(CFG));
  if (!cfg)
  {
    goto Cleanup;
  }
  cfg->channel_count = params->c.in_channel_count;
  cfg->mp3_buffer_size = DEFAULT_MP3_SIZE;
  cfg->mp3_buffer =
      malloc(cfg->mp3_buffer_size);

  cfg->pcm_sample_count = DEFAULT_PCM_SAMPLE_COUNT * params->c.in_channel_count;
  cfg->pcm = malloc(cfg->pcm_sample_count * sizeof(*cfg->pcm));
  cfg->pcm_ret[0] = cfg->pcm;
  cfg->pcm_ret[1] = cfg->pcm + cfg->pcm_sample_count / 2;
  cfg->gfp = lame_init();
  if (!cfg->mp3_buffer || !cfg->gfp || !cfg->pcm)
  {
    goto Cleanup;
  }
  id3tag_init(cfg->gfp);
  lame_set_num_channels(cfg->gfp, params->c.in_channel_count);
  lame_set_in_samplerate(cfg->gfp, params->c.in_sample_rate);
  lame_set_bWriteVbrTag(cfg->gfp, 0);
  if (params->vbr_quality >= 0)
  {
    lame_set_VBR(cfg->gfp, vbr_default);
    lame_set_VBR_quality(cfg->gfp, params->vbr_quality);
  }
  else
  {
    lame_set_VBR(cfg->gfp, vbr_off);
    lame_set_brate(cfg->gfp, params->bitrate);
  }
  lame_set_write_id3tag_automatic(cfg->gfp, 0);
  if (lame_init_params(cfg->gfp) < 0)
  {
    goto Cleanup;
  }

  return cfg;

Cleanup:
  enc_free(cfg);
  return NULL;
}

EMSCRIPTEN_KEEPALIVE
int enc_encode(PCFG cfg, unsigned int num_samples)
{
  while (MP3_BUFFER_SIZE(num_samples) > cfg->mp3_buffer_size)
  {
    cfg->mp3_buffer_size *= 2;
    cfg->mp3_buffer = realloc(cfg->mp3_buffer, cfg->mp3_buffer_size);
  }
  return lame_encode_buffer_ieee_float(cfg->gfp, cfg->pcm_ret[0], cfg->pcm_ret[1], num_samples, cfg->mp3_buffer, cfg->mp3_buffer_size);
}

EMSCRIPTEN_KEEPALIVE
int enc_flush(PCFG cfg)
{
  return lame_encode_flush(cfg->gfp, cfg->mp3_buffer, cfg->mp3_buffer_size);
}