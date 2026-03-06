<?php

namespace App\Http\Controllers;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class QrCodeController extends Controller
{
    /**
     * Generate an SVG QR code for the given relative path.
     */
    public function __invoke(Request $request, ?string $path = null): Response
    {
        $size = (int) $request->query('size', 200);
        $size = max(50, min(500, $size));

        // Allow a full URL via query param, otherwise build from relative path
        $url = $request->query('url') ?? url($path ?? '/');

        Log::info('QR code generated', [
            'path' => $path ?? '/',
            'url' => $url,
            'size' => $size,
            'ip' => $request->ip(),
        ]);

        $renderer = new ImageRenderer(
            new RendererStyle($size, 1),
            new SvgImageBackEnd
        );
        $writer = new Writer($renderer);
        $svg = $writer->writeString($url);

        return response($svg, 200, [
            'Content-Type' => 'image/svg+xml',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
