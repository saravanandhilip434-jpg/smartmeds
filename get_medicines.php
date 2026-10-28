
<?php
header("Content-Type: application/json");
require "db.php";

$result = $conn->query(
    "SELECT id, medicine_name, dosage, quantity,
            reminder_time, low_stock_limit
     FROM medicines ORDER BY id DESC"
);

if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => "Unable to fetch medicines"]);
    exit;
}

$medicines = [];

while ($row = $result->fetch_assoc()) {
    $medicines[] = $row;
}

echo json_encode($medicines);
$conn->close();
?>
