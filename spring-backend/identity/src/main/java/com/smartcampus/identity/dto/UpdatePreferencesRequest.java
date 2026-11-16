package com.smartcampus.identity.dto;

public record UpdatePreferencesRequest(String theme, String language, Boolean notificationsEnabled) {}
