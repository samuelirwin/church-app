<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Members Report</title>
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
    <h1>Members Report</h1>
    <p class="meta">Generated: {{ now()->format('F j, Y g:i A') }} | Total: {{ $members->count() }}</p>

    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Household</th>
                <th>Joined</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($members as $member)
                <tr>
                    <td>{{ $member->full_name }}</td>
                    <td>{{ $member->email ?? '-' }}</td>
                    <td>{{ $member->phone ?? '-' }}</td>
                    <td>{{ $member->membership_status->label() }}</td>
                    <td>{{ $member->household?->name ?? '-' }}</td>
                    <td>{{ $member->joined_at?->format('Y-m-d') ?? '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
