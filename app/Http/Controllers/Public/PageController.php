<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Models\Form;
use App\Models\Page;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    /**
     * Display the specified page or redirect to an external URL.
     */
    public function show(Page $page): Response|RedirectResponse
    {
        abort_unless($page->isPublished(), 404);

        if ($page->isRedirect()) {
            Log::info('Page redirect triggered', [
                'page_id' => $page->id,
                'slug' => $page->slug,
                'redirect_url' => $page->redirect_url,
            ]);

            return redirect()->away($page->redirect_url);
        }

        $page->load(['creator', 'category', 'tags', 'media']);

        // Resolve form embeds by loading referenced form data
        $embeddedForms = [];
        foreach ($page->sections ?? [] as $section) {
            if (($section['type'] ?? '') === 'form_embed' && ! empty($section['data']['form_id'])) {
                $form = Form::find($section['data']['form_id']);
                if ($form && $form->is_published) {
                    $embeddedForms[$form->id] = [
                        'id' => $form->id,
                        'title' => $form->title,
                        'slug' => $form->slug,
                        'description' => $form->description,
                        'fields' => $form->fields,
                        'settings' => $form->settings,
                        'allows_anonymous' => $form->allows_anonymous,
                    ];
                }
            }
        }

        Log::info('Page viewed', [
            'page_id' => $page->id,
            'slug' => $page->slug,
        ]);

        return Inertia::render('public/pages/show', [
            'page' => new PageResource($page),
            'embeddedForms' => $embeddedForms,
            'pageUrl' => route('pages.show', $page->slug),
        ]);
    }
}
