<?php
/**
 * Testing with curl
 * $ curl -k \
 *     -X POST \
 *     -H "Content-Type: text/csv" \
 *     -H "Content-Disposition: attachment; filename=test.csv" \
 *     --data-binary "@./test.csv" "https://testapi.local/fileserver.php"
 */

 // https://stackoverflow.com/questions/5501427/php-filesize-mb-kb-conversion
 function format_bytes($bytes, $precision = 2) {
    $units = array('B', 'kB', 'MB', 'GB');

    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1000));
    $pow = min($pow, count($units) - 1);

    $bytes /= pow(1000, $pow);

    return round($bytes, $precision) . ' ' . $units[$pow];
}

$method = $_SERVER["REQUEST_METHOD"];
$outputDir = __DIR__."/../uploads";

$response = array(
    "success" => false,
    "response" => "",
);
$httpCode = 400;

switch ($method) {
    case 'POST':
        $requestBody = file_get_contents("php://input");
        $contentDisposition = $_SERVER["HTTP_CONTENT_DISPOSITION"] ?? null;
        if ($contentDisposition === null) {
            $response["response"] = "Error: set Content-Disposition header";
            break;
        }
        preg_match(
            '/filename(\*)?=(UTF-8\'\')?"?([^";]+)"?;?/',
            $contentDisposition,
            $matches
        );
        if (!isset($matches[3])) {
            $response["response"] = "Error: set filename in Content-Disposition header";
            break;
        }
        $filter = array(
            '/\.{2,}\//', //prevents changing directory to parent directories
            '/^\/+/' //prevents using root directory or absolute path
        );
        $filePath = urldecode($matches[3]);
        $pathParts = pathinfo(preg_replace($filter, '', $filePath));
        $filename = $pathParts["basename"];
        $outputFile = "$outputDir/$filename";
        $saved = file_put_contents($outputFile, $requestBody);
        $size = format_bytes(filesize($outputFile));
        if ($saved === false) {
            $response["response"] = "Error: failed to save the file";
            $httpCode = 500;
            break;
        }
        $response["response"] = "$filename of $size uploaded";
        $response["success"] = true;
        $httpCode = 200;
        break;
    case 'GET':
    default:
        $params = $_GET;
        $response["response"] = "GET Request\nParams: ".print_r($params, true);
        $response["success"] = true;
        $httpCode = 200;
        break;
}

$jsonOutput = json_encode($response);

if ($jsonOutput === false) {
    $response["success"] = false;
    $response["response"] = json_last_error_msg();
    $jsonOutput = json_encode($response);
    $httpCode = 500;
}

http_response_code($httpCode);
header('Content-Type: application/json; charset=utf-8');
echo $jsonOutput;
exit();
