package com.example.optimize_xml_android.productlist.common;

public class Constants {
    
    // API Configuration
    public static final String BASE_URL = "https://6851a42217fe.ngrok-free.app";
    
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
