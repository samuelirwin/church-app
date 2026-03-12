<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Benevolence Report</title>
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
    <h1>Benevolence Report</h1>
    <p class="meta">Generated: {{ now()->format('F j, Y g:i A') }} | Total: {{ $requests->count() }}</p>

    <table>
        <thead>
            <tr>
                <th>Requester</th>
                <th>Category</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Approved</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($requests as $request)
                <tr>
                    <td>{{ $request->requester_name }}</td>
                    <td>{{ $request->category->label() }}</td>
                    <td>{{ $request->urgency->label() }}</td>
                    <td>{{ $request->status->label() }}</td>
                    <td>${{ number_format($request->amount_requested ?? 0, 2) }}</td>
                    <td>${{ number_format($request->amount_approved ?? 0, 2) }}</td>
                    <td>{{ $request->created_at?->format('Y-m-d') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
