-- This script runs automatically when PostgreSQL first initializes.
-- Creates one database per service so each service has isolation.
-- The database for the auth service (users and refresh tokens)
CREATE DATABASE authdb;
-- The database for the agent service (chat sessions, messages, pipeline results)
CREATE DATABASE agentdb;
-- The database for the audit service (audit records)
CREATE DATABASE auditdb;
-- The database for the analytics service (daily totals and pipeline runs)
CREATE DATABASE analyticsdb;
-- The database for the gateway service (team rate limits)
CREATE DATABASE gatewaydb;
