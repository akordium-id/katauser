import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
  const workspaceSlug = params.workspaceSlug;

  // Mock / default knowledge documents for workspace
  return {
    workspaceSlug,
    documents: [
      {
        id: 'doc_1',
        title: 'Panduan Penagihan & Faktur',
        sourceType: 'doc',
        sourceUrl: 'https://docs.acme.com/billing',
        chunksCount: 2,
        createdAt: new Date().toISOString(),
      },
    ],
  };
};

export const actions: Actions = {
  ingest: async ({ request }) => {
    const data = await request.formData();
    const title = (data.get('title') as string) || '';
    const content = (data.get('content') as string) || '';
    const sourceUrl = (data.get('sourceUrl') as string) || '';

    if (!title.trim() || title.length < 2) {
      return fail(400, { error: 'Judul dokumen minimal 2 karakter', title, content, sourceUrl });
    }

    if (!content.trim() || content.length < 10) {
      return fail(400, { error: 'Isi dokumen minimal 10 karakter', title, content, sourceUrl });
    }

    return {
      success: true,
      message: 'Dokumen berhasil di-chunk dan di-vektorisasi ke basis pengetahuan Juno!',
    };
  },
};

