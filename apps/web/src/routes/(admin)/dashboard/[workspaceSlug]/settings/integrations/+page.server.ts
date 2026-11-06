import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { validateWebhookUrl } from '$lib/integrations-helpers';

export const load: PageServerLoad = async ({ params }) => {
  const workspaceSlug = params.workspaceSlug;

  // Mock / default integrations config
  return {
    workspaceSlug,
    webhook: {
      slackWebhookUrl: '',
      discordWebhookUrl: '',
      enabledEvents: ['post.created', 'post.voted', 'chat.escalated'],
    },
  };
};

export const actions: Actions = {
  saveWebhook: async ({ request }) => {
    const data = await request.formData();
    const slackUrl = (data.get('slackWebhookUrl') as string) || '';
    const discordUrl = (data.get('discordWebhookUrl') as string) || '';

    const slackCheck = validateWebhookUrl(slackUrl, 'slack');
    if (!slackCheck.valid) {
      return fail(400, { error: slackCheck.error, slackUrl, discordUrl });
    }

    const discordCheck = validateWebhookUrl(discordUrl, 'discord');
    if (!discordCheck.valid) {
      return fail(400, { error: discordCheck.error, slackUrl, discordUrl });
    }

    return {
      success: true,
      message: 'Pengaturan integrasi webhook berhasil disimpan!',
    };
  },
};

