<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Event Registrations - {{ $event->title }}</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        h1 { font-size: 18px; margin-bottom: 5px; }
        h2 { font-size: 14px; color: #666; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .meta { color: #666; font-size: 10px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <h1>{{ $event->title }}</h1>
    <h2>Event Registrations</h2>
    <p class="meta">Generated: {{ now()->format('F j, Y g:i A') }} | Total: {{ $registrations->count() }}</p>

    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Registered At</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($registrations as $registration)
                <tr>
                    <td>{{ $registration->name }}</td>
                    <td>{{ $registration->email }}</td>
                    <td>{{ $registration->phone ?? '-' }}</td>
                    <td>{{ ucfirst($registration->status->value) }}</td>
                    <td>{{ $registration->registered_at?->format('Y-m-d H:i') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
