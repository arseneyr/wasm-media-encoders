#include <lame/lame.h>
#include <stdlib.h>
#include <stdio.h>

// 30 seconds of audio at 48kHz
#define MP3_BUFFER_SIZE(num_samples) (1.25 * (num_samples) + 7200)
#define DEFAULT_MP3_SIZE MP3_BUFFER_SIZE(48000 * 30)

typedef struct _CFG
{
  float *pcm_l;
  float *pcm_r;
  unsigned char *mp3_buffer;
  unsigned int mp3_buffer_size;
  lame_global_flags *gfp;
} CFG, *PCFG;

typedef struct _PARAMS
{
  unsigned int bitrate;
  float vbr_quality;
} PARAMS, *PPARAMS;

void enc_free(PCFG cfg)
{
  if (cfg)
  {
    if (cfg->gfp)
    {
      lame_close(cfg->gfp);
    }
    if (cfg->mp3_buffer)
    {
      free(cfg->mp3_buffer);
    }
    free(cfg);
  }
}

PCFG enc_init(unsigned int sample_rate,
              unsigned int channel_count,
              PPARAMS params)
{
  PCFG cfg = NULL;
  if (channel_count > 2 || (params->vbr_quality < 0) == (params->bitrate == 0))
  {
    goto Cleanup;
  }

  cfg = calloc(1, sizeof(CFG));
  if (!cfg)
  {
    goto Cleanup;
  }
  cfg->mp3_buffer_size = DEFAULT_MP3_SIZE;
  cfg->mp3_buffer =
      malloc(cfg->mp3_buffer_size);
  cfg->gfp = lame_init();
  if (!cfg->mp3_buffer || !cfg->gfp)
  {
    goto Cleanup;
  }
  id3tag_init(cfg->gfp);
  lame_set_num_channels(cfg->gfp, channel_count);
  lame_set_in_samplerate(cfg->gfp, sample_rate);
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

int enc_encode(PCFG cfg, unsigned int num_samples)
{
  if (MP3_BUFFER_SIZE(num_samples) > cfg->mp3_buffer_size)
  {
    cfg->mp3_buffer_size *= 2;
    cfg->mp3_buffer = realloc(cfg->mp3_buffer, cfg->mp3_buffer_size);
  }
  return lame_encode_buffer_ieee_float(cfg->gfp, cfg->pcm_l, cfg->pcm_r, num_samples, cfg->mp3_buffer, cfg->mp3_buffer_size);
}

int enc_flush(PCFG cfg)
{
  return lame_encode_flush(cfg->gfp, cfg->mp3_buffer, cfg->mp3_buffer_size);
}