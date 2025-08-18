-- Add appointments system tables and relationships

-- 1. Create appointment_slots table
CREATE TABLE `appointment_slots` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `start_time` TIMESTAMP NOT NULL,
  `end_time` TIMESTAMP NOT NULL,
  `is_available` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL
);

-- 2. Create doctor_practices table
CREATE TABLE `doctor_practices` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(255) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL
);

-- 3. Create appointments table
CREATE TABLE `appointments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `uuid` CHAR(36) NOT NULL UNIQUE,
  `slot_id` BIGINT NULL,
  `doctor_practice_id` BIGINT NULL,
  `patient_id` BIGINT NULL,
  `user_id` BIGINT NULL,
  `status` SMALLINT NOT NULL DEFAULT 0,
  `fee` INT NULL,
  `discount` INT NULL,
  `payment_status` SMALLINT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL
);

-- 4. Add foreign key constraints for appointments table
ALTER TABLE `appointments` 
ADD CONSTRAINT `fk_appointments_slot` 
FOREIGN KEY (`slot_id`) REFERENCES `appointment_slots`(`id`);

ALTER TABLE `appointments` 
ADD CONSTRAINT `fk_appointments_doctor_practice` 
FOREIGN KEY (`doctor_practice_id`) REFERENCES `doctor_practices`(`id`);

ALTER TABLE `appointments` 
ADD CONSTRAINT `fk_appointments_patient` 
FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`);

ALTER TABLE `appointments` 
ADD CONSTRAINT `fk_appointments_user` 
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`);

-- 5. Add foreign key constraint for rooms table (if not already exists)
-- This connects rooms to appointments
ALTER TABLE `rooms` 
ADD CONSTRAINT `fk_rooms_appointment` 
FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`);

-- 6. Create indexes for better performance
CREATE INDEX `idx_appointments_uuid` ON `appointments`(`uuid`);
CREATE INDEX `idx_appointments_status` ON `appointments`(`status`);
CREATE INDEX `idx_appointments_patient_id` ON `appointments`(`patient_id`);
CREATE INDEX `idx_appointments_user_id` ON `appointments`(`user_id`);
CREATE INDEX `idx_appointments_slot_id` ON `appointments`(`slot_id`);
CREATE INDEX `idx_appointments_doctor_practice_id` ON `appointments`(`doctor_practice_id`);

CREATE INDEX `idx_appointment_slots_start_time` ON `appointment_slots`(`start_time`);
CREATE INDEX `idx_appointment_slots_end_time` ON `appointment_slots`(`end_time`);
CREATE INDEX `idx_appointment_slots_is_available` ON `appointment_slots`(`is_available`);

CREATE INDEX `idx_doctor_practices_name` ON `doctor_practices`(`name`);
CREATE INDEX `idx_doctor_practices_is_active` ON `doctor_practices`(`is_active`);

-- 7. Insert sample data (optional)
INSERT INTO `doctor_practices` (`name`, `address`, `phone`, `email`) VALUES
('General Practice Clinic', '123 Main Street, City', '+1234567890', 'clinic@example.com'),
('Specialist Medical Center', '456 Oak Avenue, Town', '+1234567891', 'specialist@example.com');

-- 8. Insert sample appointment slots (optional)
INSERT INTO `appointment_slots` (`start_time`, `end_time`, `is_available`) VALUES
(NOW() + INTERVAL 1 DAY, NOW() + INTERVAL 1 DAY + INTERVAL 30 MINUTE, TRUE),
(NOW() + INTERVAL 1 DAY + INTERVAL 1 HOUR, NOW() + INTERVAL 1 DAY + INTERVAL 1 HOUR + INTERVAL 30 MINUTE, TRUE),
(NOW() + INTERVAL 2 DAY, NOW() + INTERVAL 2 DAY + INTERVAL 30 MINUTE, TRUE);
