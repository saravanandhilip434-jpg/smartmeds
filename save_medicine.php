
<?php
header("Content-Type: application/json");
require "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "POST method required"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$name = trim($data["medicine_name"] ?? "");
$dosage = trim($data["dosage"] ?? "");
$quantity = filter_var(
    $data["quantity"] ?? null,
    FILTER_VALIDATE_INT
);
$time = $data["reminder_time"] ?? "";

if (
    $name === "" || $dosage === "" ||
    $quantity === false || $quantity === null ||
    $quantity < 0 ||
    !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time)
) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid medicine details"]);
    exit;
}

$stmt = $conn->prepare(
    "INSERT INTO medicines
    (medicine_name, dosage, quantity, reminder_time)
    VALUES (?, ?, ?, ?)"
);

$stmt->bind_param("ssis", $name, $dosage, $quantity, $time);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "id" => $conn->insert_id,
        "message" => "Medicine saved successfully"
    ]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Could not save medicine"]);
}

$stmt->close();
$conn->close();
?>
