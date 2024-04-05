typedef struct _COMMON_PARAMS
{
	unsigned int in_channel_count;
	unsigned int in_sample_rate;
} COMMON_PARAMS, *PCOMMON_PARAMS;

EMSCRIPTEN_KEEPALIVE
char *version(void)
{
	return NODE_PACKAGE_VERSION;
}
