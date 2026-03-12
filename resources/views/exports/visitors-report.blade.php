<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Visitors Report</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        h1 { font-size: 18px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .meta { color: #666; font-size: 10px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <h1>Visitors Report</h1>
    <p class="meta">Generated: {{ now()->format('F j, Y g:i A') }} | Total: {{ $visitors->count() }}</p>

    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Visit Date</th>
                <th>Converted</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($visitors as $visitor)
                <tr>
                    <td>{{ $visitor->name }}</td>
                    <td>{{ $visitor->email }}</td>
                    <td>{{ $visitor->phone ?? '-' }}</td>
                    <td>{{ $visitor->created_at?->format('Y-m-d') }}</td>
                    <td>{{ $visitor->converted_to_user_id ? 'Yes' : 'No' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
