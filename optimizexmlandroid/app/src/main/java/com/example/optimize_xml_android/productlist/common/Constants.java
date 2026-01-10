package com.example.optimize_xml_android.productlist.common;

public class Constants {
    
    // API Configuration
    // Use 10.0.2.2 for Android Emulator
    // Use your computer's IP address (e.g., 192.168.x.x) for physical device
    public static final String BASE_URL = "http://192.168.102.15:4000";
    
    // Pagination Configuration
    public static final int PAGE_SIZE = 10;
    public static final int DEFAULT_PAGE = 1;
    public static final int DEFAULT_LIMIT = 10;
    
    // API Endpoints
    public static final String ENDPOINT_SEARCH_PRODUCTS = "/v1/api/product/search";
    
    // Network Timeouts (in seconds)
    public static final int CONNECT_TIMEOUT = 30;
    public static final int READ_TIMEOUT = 30;
    public static final int WRITE_TIMEOUT = 30;
        
    // Private constructor to prevent instantiation
    private Constants() {
        throw new AssertionError("Cannot instantiate Constants class");
    }
}
