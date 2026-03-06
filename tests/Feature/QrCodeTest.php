<?php

it('generates an SVG QR code at default size', function () {
    $response = $this->get(route('qr.generate', ['path' => 'sermons']));

    $response->assertSuccessful()
        ->assertHeader('Content-Type', 'image/svg+xml')
        ->assertHeader('Cache-Control', 'max-age=86400, public');

    expect($response->getContent())->toContain('<svg');
});

it('generates a QR code with custom size', function () {
    $response = $this->get(route('qr.generate', ['path' => 'sermons']).'?size=300');

    $response->assertSuccessful()
        ->assertHeader('Content-Type', 'image/svg+xml');
});

it('generates a QR code for empty path (home page)', function () {
    $response = $this->get(route('qr.generate'));

    $response->assertSuccessful()
        ->assertHeader('Content-Type', 'image/svg+xml');

    expect($response->getContent())->toContain('<svg');
});

it('clamps size to minimum of 50', function () {
    $response = $this->get(route('qr.generate', ['path' => 'test']).'?size=10');

    $response->assertSuccessful()
        ->assertHeader('Content-Type', 'image/svg+xml');
});

it('clamps size to maximum of 500', function () {
    $response = $this->get(route('qr.generate', ['path' => 'test']).'?size=1000');

    $response->assertSuccessful()
        ->assertHeader('Content-Type', 'image/svg+xml');
});

it('supports nested paths', function () {
    $response = $this->get(route('qr.generate', ['path' => 'academy/my-course']));

    $response->assertSuccessful()
        ->assertHeader('Content-Type', 'image/svg+xml');
});

it('includes cache control header', function () {
    $response = $this->get(route('qr.generate', ['path' => 'library']));

    $response->assertSuccessful()
        ->assertHeader('Cache-Control', 'max-age=86400, public');
});
