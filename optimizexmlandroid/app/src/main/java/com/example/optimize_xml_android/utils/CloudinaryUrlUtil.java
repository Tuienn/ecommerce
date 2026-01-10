package com.example.optimize_xml_android.utils;

public class CloudinaryUrlUtil {

    /**
     * Optimize Cloudinary image URL for Android
     * - Resize
     * - Auto quality
     * - Force WebP by changing file extension
     */
    public static String optimizeToWebp(String originalUrl, int width) {
        if (originalUrl == null || !originalUrl.contains("/upload/")) {
            return originalUrl;
        }

        String transform = "w_" + width + ",c_limit,f_auto,q_auto";

        // Chèn transform
        String[] parts = originalUrl.split("/upload/", 2);
        String optimized = parts[0] + "/upload/" + transform + "/" + parts[1];

        // Ép đuôi webp
        return forceWebpExtension(optimized);
    }

    /**
     * Thay đuôi file thành .webp (an toàn)
     */
    private static String forceWebpExtension(String url) {
        // Xóa query nếu có
        String cleanUrl = url.split("\\?")[0];

        // Thay extension
        return cleanUrl.replaceAll("\\.(jpg|jpeg|png|webp)$", ".webp");
    }
}
