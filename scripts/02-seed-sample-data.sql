-- Adding sample data for testing
-- Insert sample students
INSERT INTO students (student_number, name, surname, contact_details, res_address) VALUES
('50763865', 'Thandeka Confidence', 'Masangane', '0123456789', '123 Student Village, Potchefstroom'),
('46985972', 'Liyabona', 'Tokoyi', '0123456790', '456 Campus Heights, Potchefstroom'),
('48497002', 'Mbali', 'Dyobiso', '0123456791', '789 University Residence, Potchefstroom'),
('41435249', 'Keitumetse', 'Mahlase', '0123456792', '321 Student Apartments, Potchefstroom'),
('45492255', 'Nqobile', 'Makola', '0123456793', '654 Campus Lodge, Potchefstroom');

-- Insert sample drivers
INSERT INTO drivers (name, surname, license, contact_details, availability_status) VALUES
('John', 'Smith', 'DL001234', '0987654321', true),
('Sarah', 'Johnson', 'DL005678', '0987654322', true),
('Michael', 'Brown', 'DL009012', '0987654323', false),
('Lisa', 'Davis', 'DL003456', '0987654324', true);

-- Insert sample vehicles
INSERT INTO vehicles (registration, type, capacity, status) VALUES
('NWU001GP', 'Minibus', 14, 'available'),
('NWU002GP', 'Minibus', 14, 'in_use'),
('NWU003GP', 'Bus', 35, 'available'),
('NWU004GP', 'Minibus', 14, 'maintenance');

-- Insert sample admin
INSERT INTO admin (name, surname, contact_details, id_number, status) VALUES
('Admin', 'User', '0111222333', '8001010001088', 'active');

-- Insert sample requests
INSERT INTO requests (student_id, pickup_time, pickup_location, status) VALUES
(1, '2025-01-20 08:00:00', '123 Student Village, Potchefstroom', 'pending'),
(2, '2025-01-20 08:15:00', '456 Campus Heights, Potchefstroom', 'assigned'),
(3, '2025-01-20 16:30:00', 'NWU Campus', 'completed');
