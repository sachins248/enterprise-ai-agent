// This file belongs to the enums package
package com.enterprise.auth.enums;

// The list of roles a user can have
// We use roles to decide who is allowed to do what
public enum Role {
    // Can do everything, including seeing team-wide data
    ADMIN,
    // Normal user who uses the AI assistant
    DEVELOPER,
    // Can only look at things, not change them
    VIEWER
}
