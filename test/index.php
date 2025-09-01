<?php
// --- PHP Logic (Unchanged from before) ---
$api_response = null;
$error_message = null;
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $year = $_POST['year'];
    $api_key = $_POST['api_key'];
    $start_date = $_POST['start_date'];
    $end_date = $_POST['end_date'];
    $station_id = $_POST['station_id'];

    $base_url = "http://localhost:8000/api/v1/sales/" . urlencode($year);
    $query_params = [];
    if (!empty($start_date)) { $query_params['start_date'] = $start_date; }
    if (!empty($end_date)) { $query_params['end_date'] = $end_date; }
    if (!empty($station_id)) { $query_params['station_id'] = $station_id; }
    if (!empty($query_params)) { $base_url .= '?' . http_build_query($query_params); }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $base_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
    $headers = ['accept: application/json', 'X-API-Key: ' . $api_key];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response_body = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        $error_message = 'cURL Error: ' . curl_error($ch);
    } else {
        if ($http_code == 200) {
            $data = json_decode($response_body, true);
            $api_response = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        } else {
            $error_data = json_decode($response_body, true);
            $error_message = "API Error (HTTP {$http_code}): " . ($error_data['detail'] ?? 'An unknown error occurred.');
        }
    }
    curl_close($ch);
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP API Test Page - Tailwind CSS</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-100 flex items-center justify-center min-h-screen p-4">

<main class="bg-white w-full max-w-2xl p-8 rounded-xl shadow-lg space-y-8">
    <div>
        <h1 class="text-center text-3xl font-bold text-slate-800">API Test Page</h1>
        <p class="text-center text-slate-500 mt-2">Built with PHP and styled with Tailwind CSS</p>
    </div>

    <form action="" method="POST" class="space-y-6">
        <div>
            <label for="year" class="block text-sm font-medium text-gray-700">Year</label>
            <input type="number" id="year" name="year" placeholder="e.g., 2023" value="<?= htmlspecialchars($_POST['year'] ?? '') ?>" required
                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
        </div>
        <div>
            <label for="api-key" class="block text-sm font-medium text-gray-700">API Key</label>
            <input type="password" id="api-key" name="api_key" placeholder="Paste your API key here" required
                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
        </div>

        <hr/>
        <h3 class="text-lg font-medium text-slate-700">Filters (Optional)</h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label for="station_id" class="block text-sm font-medium text-gray-700">Station ID</label>
                <input type="text" id="station_id" name="station_id" placeholder="Enter Station ID" value="<?= htmlspecialchars($_POST['station_id'] ?? '') ?>"
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label for="start_date" class="block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" id="start_date" name="start_date" value="<?= htmlspecialchars($_POST['start_date'] ?? '') ?>"
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label for="end_date" class="block text-sm font-medium text-gray-700">End Date</label>
                <input type="date" id="end_date" name="end_date" value="<?= htmlspecialchars($_POST['end_date'] ?? '') ?>"
                       class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
        </div>

        <div>
            <button type="submit"
                    class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                Fetch Data
            </button>
        </div>
    </form>

    <?php if ($api_response || $error_message): ?>
    <div class="mt-8">
        <?php if ($api_response): ?>
        <h3 class="text-lg font-medium text-slate-700">API Response:</h3>
        <pre class="mt-2 bg-gray-800 text-white p-4 rounded-md text-sm overflow-x-auto"><?= htmlspecialchars($api_response) ?></pre>
        <?php elseif ($error_message): ?>
        <h3 class="text-lg font-medium text-slate-700">Error:</h3>
        <div class="mt-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            <?= htmlspecialchars($error_message) ?>
        </div>
        <?php endif; ?>
    </div>
    <?php endif; ?>
</main>

</body>
</html>