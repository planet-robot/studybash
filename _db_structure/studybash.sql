
-- phpMyAdmin SQL Dump
-- version 2.11.11.3
-- http://www.phpmyadmin.net
--
-- Host: 68.178.143.44
-- Generation Time: Feb 11, 2014 at 01:24 AM
-- Server version: 5.5.33
-- PHP Version: 5.1.6

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `studybash`
--

-- --------------------------------------------------------

--
-- Table structure for table `sb_1_classes`
--

CREATE TABLE `sb_1_classes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `subject_id` bigint(20) unsigned NOT NULL,
  `code` varchar(12) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subject_id` (`subject_id`,`code`),
  KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_classes`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_enrollment`
--

CREATE TABLE `sb_1_enrollment` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `module_id` bigint(20) unsigned NOT NULL,
  `class_name` varchar(64) DEFAULT NULL,
  `lecturer_name` varchar(64) DEFAULT NULL,
  `textbook_url` varchar(128) DEFAULT NULL,
  `completed` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`module_id`),
  KEY `module_id` (`module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_enrollment`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_flagged_flashcards`
--

CREATE TABLE `sb_1_flagged_flashcards` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `flagged_by_id` bigint(20) unsigned NOT NULL,
  `flashcard_id` bigint(20) unsigned NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `flagged_by_id` (`flagged_by_id`,`flashcard_id`),
  KEY `flashcard_id` (`flashcard_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_flagged_flashcards`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_flagged_sets`
--

CREATE TABLE `sb_1_flagged_sets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `flagged_by_id` bigint(20) unsigned NOT NULL,
  `set_id` bigint(20) unsigned NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `flagged_by_id` (`flagged_by_id`,`set_id`),
  KEY `set_id` (`set_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_flagged_sets`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_flagged_tests`
--

CREATE TABLE `sb_1_flagged_tests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `flagged_by_id` bigint(20) unsigned NOT NULL,
  `test_id` bigint(20) unsigned NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `flagged_by_id` (`flagged_by_id`,`test_id`),
  KEY `test_id` (`test_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_flagged_tests`
--

-- --------------------------------------------------------

--
-- Table structure for table `sb_1_flashcards`
--

CREATE TABLE `sb_1_flashcards` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `set_id` bigint(20) unsigned NOT NULL,
  `order_id` bigint(20) unsigned NOT NULL,
  `question_text` varchar(14336) NOT NULL,
  `answer_text` varchar(4096) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `set_id` (`set_id`),
  KEY `order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_flashcards`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_flashcard_tags`
--

CREATE TABLE `sb_1_flashcard_tags` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `flashcard_id` bigint(20) unsigned NOT NULL,
  `tag_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `flashcard_id` (`flashcard_id`,`tag_id`),
  KEY `tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_flashcard_tags`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_groups`
--

CREATE TABLE `sb_1_groups` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `enrollment_id` bigint(20) unsigned NOT NULL,
  `code` varchar(6) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `enrollment_id` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_groups`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_group_membership`
--

CREATE TABLE `sb_1_group_membership` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `group_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_id` (`group_id`,`user_id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_group_membership`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_modules`
--

CREATE TABLE `sb_1_modules` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `class_id` bigint(20) unsigned NOT NULL,
  `semester_id` bigint(20) unsigned NOT NULL,
  `year` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `class_id` (`class_id`,`semester_id`,`year`),
  KEY `semester_id` (`semester_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_modules`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_semesters`
--

CREATE TABLE `sb_1_semesters` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(16) NOT NULL,
  `description` varchar(32) NOT NULL,
  `order_id` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_semesters`
--

INSERT INTO `sb_1_semesters` (`id`, `name`, `description`, `order_id`) VALUES (1, 'Spring', 'Jan - Apr', 0);
INSERT INTO `sb_1_semesters` (`id`, `name`, `description`, `order_id`) VALUES (2, 'Intersession', 'May - Jun', 1);
INSERT INTO `sb_1_semesters` (`id`, `name`, `description`, `order_id`) VALUES (3, 'Summer Session', 'Jun - Aug', 2);
INSERT INTO `sb_1_semesters` (`id`, `name`, `description`, `order_id`) VALUES (4, 'Summer', 'May - Aug', 3);
INSERT INTO `sb_1_semesters` (`id`, `name`, `description`, `order_id`) VALUES (5, 'Fall', 'Sep - Dec', 4);

-- --------------------------------------------------------

--
-- Table structure for table `sb_1_session_tokens`
--

CREATE TABLE `sb_1_session_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `session_user_id` bigint(20) unsigned NOT NULL,
  `session_user_agent` varchar(256) NOT NULL,
  `session_token` varchar(128) NOT NULL,
  `issued_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_user_id` (`session_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_session_tokens`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_sets`
--

CREATE TABLE `sb_1_sets` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `enrollment_id` bigint(20) unsigned NOT NULL,
  `set_name` varchar(32) NOT NULL,
  `description` varchar(64) DEFAULT NULL,
  `sharing` varchar(16) NOT NULL,
  `has_auto_test` tinyint(1) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `enrollment_id` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_sets`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_subjects`
--

CREATE TABLE `sb_1_subjects` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_subjects`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_tests`
--

CREATE TABLE `sb_1_tests` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `enrollment_id` bigint(20) unsigned NOT NULL,
  `test_name` varchar(32) NOT NULL,
  `description` varchar(64) DEFAULT NULL,
  `sharing` varchar(16) NOT NULL,
  `setIDs` varchar(256) NOT NULL,
  `keywords` varchar(1024) DEFAULT NULL,
  `tags` varchar(1024) DEFAULT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `enrollment_id` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_tests`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_1_users`
--

CREATE TABLE `sb_1_users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `institution_id` bigint(20) unsigned NOT NULL,
  `email` varchar(64) NOT NULL,
  `password` varchar(64) NOT NULL,
  `status` int(11) NOT NULL DEFAULT '0',
  `reputation` bigint(20) unsigned NOT NULL DEFAULT '1',
  `first_name` varchar(32) NOT NULL,
  `last_name` varchar(32) NOT NULL,
  `full_name` varchar(64) NOT NULL,
  `registered_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime NOT NULL,
  `num_logins` bigint(20) unsigned NOT NULL DEFAULT '0',
  `logged_in` tinyint(1) NOT NULL DEFAULT '0',
  `verification_code` varchar(16) NOT NULL,
  `last_system_msg_read` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_1_users`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_debug_activity`
--

CREATE TABLE `sb_debug_activity` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(128) DEFAULT NULL,
  `institution_id` bigint(20) DEFAULT NULL,
  `activity_key` varchar(128) NOT NULL,
  `activity_value` varchar(4096) NOT NULL,
  `interest_level` enum('very low','low','medium','high','very high') NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `interest_level` (`interest_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_debug_activity`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_debug_errors`
--

CREATE TABLE `sb_debug_errors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `agent` varchar(256) DEFAULT NULL,
  `user_id` varchar(128) DEFAULT NULL,
  `institution_id` bigint(20) unsigned DEFAULT NULL,
  `message` varchar(2048) NOT NULL,
  `trace` varchar(4096) NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `sb_debug_errors`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_institutions`
--

CREATE TABLE `sb_institutions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(128) NOT NULL,
  `email_suffix` varchar(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_suffix` (`email_suffix`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `sb_institutions`
--

INSERT INTO `sb_institutions` VALUES(1, 'Universal Univerality University', 'uuu.ca');

-- --------------------------------------------------------

--
-- Table structure for table `sb_settings`
--

CREATE TABLE `sb_settings` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(64) NOT NULL,
  `setting_value` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=17 ;

--
-- Dumping data for table `sb_settings`
--

INSERT INTO `sb_settings` VALUES(1, 'classes_yearsAfter', '0');
INSERT INTO `sb_settings` VALUES(2, 'classes_yearsBefore', '5');
INSERT INTO `sb_settings` VALUES(3, 'enrollment_minStudents', '5');
INSERT INTO `sb_settings` VALUES(4, 'enrollment_numSuggestions', '3');
INSERT INTO `sb_settings` VALUES(5, 'enrollment_suggestions_minStudents', '3');
INSERT INTO `sb_settings` VALUES(6, 'enum_studying_sharing_types', 'public|studygroup|none');
INSERT INTO `sb_settings` VALUES(7, 'flagReputationMultiplier', '3');
INSERT INTO `sb_settings` VALUES(8, 'max_users', '300');
INSERT INTO `sb_settings` VALUES(9, 'site_locked', '0');
INSERT INTO `sb_settings` VALUES(10, 'system_message_interval', '300000');
INSERT INTO `sb_settings` VALUES(11, 'user_status_admin', '10');
INSERT INTO `sb_settings` VALUES(12, 'user_status_blocked', '-1');
INSERT INTO `sb_settings` VALUES(13, 'user_status_normal', '2');
INSERT INTO `sb_settings` VALUES(14, 'user_status_not_verified', '0');
INSERT INTO `sb_settings` VALUES(15, 'user_status_privileged', '3');
INSERT INTO `sb_settings` VALUES(16, 'user_status_probation', '1');

-- --------------------------------------------------------

--
-- Table structure for table `sb_system_msgs`
--

CREATE TABLE `sb_system_msgs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `created_on` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `message` varchar(1024) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `sb_system_msgs`
--


-- --------------------------------------------------------

--
-- Table structure for table `sb_tags`
--

CREATE TABLE `sb_tags` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tag_text` varchar(16) NOT NULL,
  `is_auto` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tag_text` (`tag_text`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=13 ;

--
-- Dumping data for table `sb_tags`
--

INSERT INTO `sb_tags` VALUES(1, 'article', 0);
INSERT INTO `sb_tags` VALUES(2, 'creative', 0);
INSERT INTO `sb_tags` VALUES(3, 'difficulty1', 0);
INSERT INTO `sb_tags` VALUES(4, 'difficulty2', 0);
INSERT INTO `sb_tags` VALUES(7, 'difficulty3', 0);
INSERT INTO `sb_tags` VALUES(8, 'follow-up', 0);
INSERT INTO `sb_tags` VALUES(9, 'lecture', 0);
INSERT INTO `sb_tags` VALUES(10, 'note', 1);
INSERT INTO `sb_tags` VALUES(11, 'review', 0);
INSERT INTO `sb_tags` VALUES(12, 'textbook', 0);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `sb_1_classes`
--
ALTER TABLE `sb_1_classes`
  ADD CONSTRAINT `sb_1_classes_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `sb_1_subjects` (`id`);

--
-- Constraints for table `sb_1_enrollment`
--
ALTER TABLE `sb_1_enrollment`
  ADD CONSTRAINT `sb_1_enrollment_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `sb_1_modules` (`id`),
  ADD CONSTRAINT `sb_1_enrollment_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sb_1_users` (`id`);

--
-- Constraints for table `sb_1_flagged_flashcards`
--
ALTER TABLE `sb_1_flagged_flashcards`
  ADD CONSTRAINT `sb_1_flagged_flashcards_ibfk_2` FOREIGN KEY (`flashcard_id`) REFERENCES `sb_1_flashcards` (`id`),
  ADD CONSTRAINT `sb_1_flagged_flashcards_ibfk_1` FOREIGN KEY (`flagged_by_id`) REFERENCES `sb_1_users` (`id`);

--
-- Constraints for table `sb_1_flagged_sets`
--
ALTER TABLE `sb_1_flagged_sets`
  ADD CONSTRAINT `sb_1_flagged_sets_ibfk_2` FOREIGN KEY (`set_id`) REFERENCES `sb_1_sets` (`id`),
  ADD CONSTRAINT `sb_1_flagged_sets_ibfk_1` FOREIGN KEY (`flagged_by_id`) REFERENCES `sb_1_users` (`id`);

--
-- Constraints for table `sb_1_flagged_tests`
--
ALTER TABLE `sb_1_flagged_tests`
  ADD CONSTRAINT `sb_1_flagged_tests_ibfk_2` FOREIGN KEY (`test_id`) REFERENCES `sb_1_tests` (`id`),
  ADD CONSTRAINT `sb_1_flagged_tests_ibfk_1` FOREIGN KEY (`flagged_by_id`) REFERENCES `sb_1_users` (`id`);
  
--
-- Constraints for table `sb_1_flashcards`
--
ALTER TABLE `sb_1_flashcards`
  ADD CONSTRAINT `sb_1_flashcards_ibfk_1` FOREIGN KEY (`set_id`) REFERENCES `sb_1_sets` (`id`);

--
-- Constraints for table `sb_1_flashcard_tags`
--
ALTER TABLE `sb_1_flashcard_tags`
  ADD CONSTRAINT `sb_1_flashcard_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `sb_tags` (`id`),
  ADD CONSTRAINT `sb_1_flashcard_tags_ibfk_1` FOREIGN KEY (`flashcard_id`) REFERENCES `sb_1_flashcards` (`id`);

--
-- Constraints for table `sb_1_groups`
--
ALTER TABLE `sb_1_groups`
  ADD CONSTRAINT `sb_1_groups_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `sb_1_enrollment` (`id`);

--
-- Constraints for table `sb_1_group_membership`
--
ALTER TABLE `sb_1_group_membership`
  ADD CONSTRAINT `sb_1_group_membership_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `sb_1_users` (`id`),
  ADD CONSTRAINT `sb_1_group_membership_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `sb_1_groups` (`id`);

--
-- Constraints for table `sb_1_modules`
--
ALTER TABLE `sb_1_modules`
  ADD CONSTRAINT `sb_1_modules_ibfk_2` FOREIGN KEY (`semester_id`) REFERENCES `sb_1_semesters` (`id`),
  ADD CONSTRAINT `sb_1_modules_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `sb_1_classes` (`id`);

--
-- Constraints for table `sb_1_session_tokens`
--
ALTER TABLE `sb_1_session_tokens`
  ADD CONSTRAINT `sb_1_session_tokens_ibfk_1` FOREIGN KEY (`session_user_id`) REFERENCES `sb_1_users` (`id`);

--
-- Constraints for table `sb_1_sets`
--
ALTER TABLE `sb_1_sets`
  ADD CONSTRAINT `sb_1_sets_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `sb_1_enrollment` (`id`);

--
-- Constraints for table `sb_1_tests`
--
ALTER TABLE `sb_1_tests`
  ADD CONSTRAINT `sb_1_tests_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `sb_1_enrollment` (`id`);
