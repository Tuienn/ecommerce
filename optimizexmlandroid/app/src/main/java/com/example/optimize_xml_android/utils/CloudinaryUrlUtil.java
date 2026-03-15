package com.example.optimize_xml_android.utils;

public class CloudinaryUrlUtil {

    public static String optimizeToWebp(String originalUrl, int width) {
        if (originalUrl == null || !originalUrl.contains("/upload/")) {
            return originalUrl;
        }

        // f_auto: Tự động chọn định dạng ảnh tốt nhất (WebP, AVIF...)
        // q_auto: Tự động cân chỉnh chất lượng
        // c_limit: Resize nhưng không scale up nếu ảnh gốc nhỏ hơn
        String transform = "w_" + width + ",c_limit,f_auto,q_auto";

        String[] parts = originalUrl.split("/upload/", 2);
        
        return parts[0] + "/upload/" + transform + "/" + parts[1];
    }
}