package com.example.optimize_xml_android.productlist.ui;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.optimize_xml_android.R;
import com.example.optimize_xml_android.productlist.adapter.ProductAdapter;
import com.example.optimize_xml_android.productlist.model.Product;
import java.util.ArrayList;
import java.util.List;

public class ProductListActivity extends AppCompatActivity {
    private RecyclerView rvProducts;
    private ProductAdapter productAdapter;
    private List<Product> productList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_product_list);

        // Initialize RecyclerView
        rvProducts = findViewById(R.id.rvProducts);
        
        // Set GridLayoutManager with 2 columns
        GridLayoutManager layoutManager = new GridLayoutManager(this, 2);
        rvProducts.setLayoutManager(layoutManager);
        
        // Generate fake products
        productList = generateFakeProducts();
        
        // Initialize and set adapter
        productAdapter = new ProductAdapter(productList);
        rvProducts.setAdapter(productAdapter);
    }

    private List<Product> generateFakeProducts() {
        List<Product> products = new ArrayList<>();
        
        products.add(new Product(
            "Áo thun nam cotton cao cấp",
            200000,
            150000,
            25,
            1250,
            ""
        ));
        
        products.add(new Product(
            "Quần jean nam slim fit",
            450000,
            315000,
            30,
            890,
            ""
        ));
        
        products.add(new Product(
            "Giày thể thao nữ",
            850000,
            680000,
            20,
            2340,
            ""
        ));
        
        products.add(new Product(
            "Váy dạ hội sang trọng",
            1200000,
            840000,
            30,
            456,
            ""
        ));
        
        products.add(new Product(
            "Áo khoác bomber nam",
            650000,
            455000,
            30,
            1780,
            ""
        ));
        
        products.add(new Product(
            "Túi xách nữ da thật",
            980000,
            588000,
            40,
            3210,
            ""
        ));
        
        products.add(new Product(
            "Đồng hồ thời trang",
            350000,
            280000,
            20,
            567,
            ""
        ));
        
        products.add(new Product(
            "Mũ lưỡi trai thể thao",
            150000,
            105000,
            30,
            4890,
            ""
        ));
        
        products.add(new Product(
            "Kính mát nam nữ",
            250000,
            175000,
            30,
            2100,
            ""
        ));
        
        products.add(new Product(
            "Dép sandal nữ đi biển",
            180000,
            126000,
            30,
            1560,
            ""
        ));
        
        products.add(new Product(
            "Balo laptop cao cấp",
            550000,
            440000,
            20,
            789,
            ""
        ));
        
        products.add(new Product(
            "Ví da nam sang trọng",
            280000,
            196000,
            30,
            3450,
            ""
        ));
        
        products.add(new Product(
            "Áo sơ mi công sở",
            320000,
            256000,
            20,
            678,
            ""
        ));
        
        products.add(new Product(
            "Quần short thể thao",
            160000,
            96000,
            40,
            5120,
            ""
        ));
        
        products.add(new Product(
            "Giày da nam công sở",
            750000,
            525000,
            30,
            890,
            ""
        ));
        
        return products;
    }
}
