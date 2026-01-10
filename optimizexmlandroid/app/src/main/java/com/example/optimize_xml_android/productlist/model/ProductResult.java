package com.example.optimize_xml_android.productlist.model;

import java.util.List;

public class ProductResult {
    private List<Product> products;
    private Pagination pagination;

    public ProductResult(List<Product> products, Pagination pagination) {
        this.products = products;
        this.pagination = pagination;
    }

    public List<Product> getProducts() {
        return products;
    }

    public void setProducts(List<Product> products) {
        this.products = products;
    }

    public Pagination getPagination() {
        return pagination;
    }

    public void setPagination(Pagination pagination) {
        this.pagination = pagination;
    }

    public static class Pagination {
        private int page;
        private int limit;
        private int totalItems;
        private int totalPages;

        public Pagination(int page, int limit, int totalItems, int totalPages) {
            this.page = page;
            this.limit = limit;
            this.totalItems = totalItems;
            this.totalPages = totalPages;
        }

        public int getPage() {
            return page;
        }

        public int getLimit() {
            return limit;
        }

        public int getTotalItems() {
            return totalItems;
        }

        public int getTotalPages() {
            return totalPages;
        }
    }
}
