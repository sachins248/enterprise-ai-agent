-- This script runs automatically when PostgreSQL first initializes.
-- Creates one database per service so each service has isolation.
CREATE DATABASE authdb;
CREATE DATABASE agentdb;
CREATE DATABASE auditdb;
CREATE DATABASE analyticsdb;
CREATE DATABASE gatewaydb;
