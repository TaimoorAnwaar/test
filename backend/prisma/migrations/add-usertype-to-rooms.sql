-- Add usertype column to rooms table
ALTER TABLE `rooms` ADD COLUMN `user_type_id` SMALLINT NOT NULL DEFAULT 10;

-- Add foreign key constraint
ALTER TABLE `rooms` ADD CONSTRAINT `fk_rooms_user_type` 
FOREIGN KEY (`user_type_id`) REFERENCES `user_types`(`id`);

-- Update existing rooms to have patient usertype (ID 10) by default
UPDATE `rooms` SET `user_type_id` = 10 WHERE `user_type_id` IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE `rooms` MODIFY COLUMN `user_type_id` SMALLINT NOT NULL;
