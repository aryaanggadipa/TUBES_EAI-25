# FashionPlace - Platform E-Commerce Berbasis Microservices

FashionPlace adalah aplikasi e-commerce fungsional yang dirancang untuk menjual pakaian dan aksesoris. Aplikasi ini memungkinkan pengguna untuk menelusuri katalog produk, mendaftar dan masuk ke akun mereka, melakukan pemesanan, dan melihat riwayat pesanan mereka. Sistem ini dirancang agar dapat diskalakan dan dipelihara dengan memisahkan domain bisnis menjadi layanan mikro yang independen.

## Arsitektur

Aplikasi ini dibangun di atas arsitektur microservices dan diorkestrasi menggunakan Docker Compose. Desain ini mendukung pemisahan masalah (separation of concerns), penerapan independen, dan fleksibilitas teknologi untuk setiap layanan.

- **Frontend**: Aplikasi web statis yang disajikan oleh kontainer **Nginx**.
- **Layanan Backend**: Kumpulan aplikasi **Node.js/Express**, masing-masing mengekspos **GraphQL API**.
- **Database**: Sebuah instance database **MySQL** pusat yang dibagikan di seluruh layanan, dengan setiap layanan mengelola skemanya sendiri.
- **Jaringan**: Semua kontainer terhubung melalui jaringan bridge Docker kustom (`marketplace_network`), memungkinkan komunikasi yang lancar antar layanan.



## Layanan (Services)

Berikut adalah rincian detail dari setiap layanan dalam file `docker-compose.yml`.

### 1. Frontend (Nginx)

- **Nama Kontainer**: `marketplace_frontend`
- **Image**: `nginx:alpine`
- **Port**: `8081:80`
- **Deskripsi**: Menyajikan file HTML, CSS, dan JavaScript statis yang terletak di direktori `./frontend`. Ini bertindak sebagai antarmuka pengguna utama untuk aplikasi. JavaScript frontend secara dinamis me-render konten berdasarkan status otentikasi pengguna dan berinteraksi dengan berbagai API GraphQL backend untuk mengambil data dan melakukan tindakan.

### 2. Layanan Otentikasi

- **Nama Kontainer**: `auth_service`
- **Konteks Build**: `./auth-service`
- **Port**: `4005:4005`
- **Deskripsi**: Mengelola pendaftaran dan login pengguna. Layanan ini menggunakan `bcryptjs` untuk mengenkripsi kata sandi dan `jsonwebtoken` (JWT) untuk membuat token otentikasi stateless yang aman bagi pengguna setelah berhasil login.
- **Skema Database**: `auth_db`

### 3. Layanan Produk

- **Nama Kontainer**: `product_service`
- **Konteks Build**: `./product-service`
- **Port**: `4001:4001`
- **Deskripsi**: Bertanggung jawab untuk mengelola katalog produk. Layanan ini menyediakan endpoint GraphQL untuk membuat, membaca, memperbarui, dan menghapus produk (operasi CRUD).
- **Skema Database**: `product_catalog_db`

### 4. Layanan Pesanan

- **Nama Kontainer**: `order_service`
- **Konteks Build**: `./order-service`
- **Port**: `4002:4002`
- **Deskripsi**: Menangani semua logika yang terkait dengan pesanan pelanggan. Ini memungkinkan pengguna untuk membuat pesanan baru dan melihat pesanan sebelumnya. Layanan ini berkomunikasi dengan `product_service` untuk mengambil detail produk saat membuat pesanan.
- **Skema Database**: `order_db`

### 5. Layanan Stok

- **Nama Kontainer**: `stock_service`
- **Konteks Build**: `./stock-service`
- **Port**: `4004:4004`
- **Deskripsi**: Mengelola stok produk, termasuk penambahan, pengurangan, dan pemantauan tingkat stok. Layanan ini mencatat semua perubahan stok dalam riwayat untuk tujuan audit. Ketika tingkat stok turun di bawah titik pemesanan ulang (*reorder point*), layanan ini secara otomatis memicu permintaan produksi baru ke `production-request-service` untuk memastikan ketersediaan produk. Selain itu, layanan ini juga mengelola permintaan umpan balik (*feedback*) terkait batch produksi.
- **Skema Database**: `stock_db`

### 6. Layanan Permintaan Produksi

- **Nama Kontainer**: `production_request_service`
- **Konteks Build**: `./production-request-service`
- **Port**: `4003:4003`
- **Deskripsi**: Mengelola permintaan untuk manufaktur produk baru, yang dapat dipicu saat stok menipis atau pesanan baru dibuat. Berkomunikasi dengan endpoint GraphQL dari sistem manufaktur eksternal.
- **Skema Database**: `production_request_db`

### 7. Database MySQL

- **Nama Kontainer**: `mysql_marketplace`
- **Image**: `mysql:8.0`
- **Port**: `3307:3306`
- **Deskripsi**: Database pusat untuk aplikasi. Menggunakan volume Docker persisten (`mysql_martketplace`) untuk menyimpan data. Saat inisialisasi, ia menjalankan skrip SQL dari `./mysql/init` untuk membuat database dan tabel yang diperlukan untuk setiap layanan.

## Memulai

Ikuti petunjuk ini untuk menyiapkan dan menjalankan aplikasi FashionPlace di mesin lokal Anda.

### Prasyarat

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Instalasi

1.  **Clone Repositori**

    ```bash
    git clone <url-repositori-anda>
    cd marketplace-sistem
    ```

2.  **Konfigurasi Variabel Lingkungan**

    File `docker-compose.yml` berisi beberapa variabel lingkungan. Yang paling penting adalah `JWT_SECRET` di `auth_service`. Untuk produksi, sangat disarankan untuk menggunakan file `.env`.

    Buat file `.env` di direktori root dan tambahkan yang berikut:

    ```
    JWT_SECRET=kunci_jwt_rahasia_anda_yang_super_panjang
    ```

3.  **Build dan Jalankan Aplikasi**

    Gunakan Docker Compose untuk membangun image dan memulai semua kontainer dalam mode detached:

    ```bash
    docker-compose up --build -d
    ```

4.  **Akses Aplikasi**

    Setelah semua kontainer berjalan, Anda dapat mengakses frontend FashionPlace di browser Anda:

    - **URL**: [http://localhost:8081](http://localhost:8081)

5.  **Menghentikan Aplikasi**

    Untuk menghentikan semua kontainer yang berjalan, gunakan perintah berikut:

    ```bash
    docker-compose down
    ```

## Endpoint API

Setiap layanan backend mengekspos endpoint GraphQL. Anda dapat menggunakan klien GraphQL seperti Postman atau Insomnia untuk berinteraksi langsung dengan mereka.

- **Layanan Produk**: `http://localhost:4001/graphql`
- **Layanan Pesanan**: `http://localhost:4002/graphql`
- **Layanan Permintaan Produksi**: `http://localhost:4003/graphql`
- **Layanan Stok**: `http://localhost:4004/graphql`
- **Layanan Otentikasi**: `http://localhost:4005/graphql`

## Skema GraphQL

Berikut adalah skema GraphQL lengkap untuk setiap layanan backend.

<details>
<summary><strong>Layanan Otentikasi (Auth Service)</strong></summary>

```graphql
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    login(email: String!, password: String!): AuthPayload
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): User
  }
```

</details>

<details>
<summary><strong>Layanan Produk (Product Service)</strong></summary>

```graphql
  type Product {
    product_id: ID!
    product_name: String!
    description: String
    category_id: String
    base_price: Float!
    default_image_url: String
  }

  type Query {
    products: [Product]
    product(product_id: ID!): Product
  }

  type Mutation {
    addProduct(
      product_name: String!, 
      description: String, 
      category_id: String, 
      base_price: Float!, 
      default_image_url: String
    ): Product
    updateProduct(
      product_id: ID!,
      product_name: String, 
      description: String, 
      category_id: String, 
      base_price: Float, 
      default_image_url: String
    ): Product
    deleteProduct(product_id: ID!): Product
  }
```

</details>

<details>
<summary><strong>Layanan Pesanan (Order Service)</strong></summary>

```graphql
  scalar DateTime

  type Order {
    id: ID!
    customerEmail: String!
    orderDate: DateTime!
    status: String!
    totalPrice: Float!
    shippingAddress: String!
    paymentMethod: String!
    notes: String
    items: [OrderItem!]!
  }

  type OrderItem {
    id: ID!
    productId: Int!
    quantity: Int!
    price: Float!
  }

  input OrderItemInput {
    productId: Int!
    quantity: Int!
    price: Float!
  }

  input CreateOrderInput {
    customerEmail: String!
    shippingAddress: String!
    paymentMethod: String!
    notes: String
    items: [OrderItemInput!]!
  }

  type Query {
    order(id: ID!): Order
    ordersByCustomer(email: String!): [Order]
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order
  }
```

</details>

<details>
<summary><strong>Layanan Permintaan Produksi (Production Request Service)</strong></summary>

```graphql
  scalar DateTime

  enum Priority {
    low
    normal
    high
    urgent
  }

  enum Status {
    received
    planned
    in_production
    completed
    cancelled
  }

  type ProductionRequest {
    id: ID!
    product_id: Int!
    product_name: String
    quantity: Int
    priority: Priority
    due_date: String
    status: Status
    manufacture_batch_id: String
    created_at: DateTime!
    updated_at: DateTime!
  }

  input CreateInternalProductionRequestInput {
    product_id: Int!
    quantity: Int!
    due_date: String!
  }

  input UpdateProductionRequestInput {
    id: ID!
    manufacturer_batch_id: String!
  }

  type Query {
    productionRequest(id: Int!): ProductionRequest
    allProductionRequests: [ProductionRequest]
  }

  type Mutation {
    createRequest(input: CreateInternalProductionRequestInput!): ProductionRequest
    updateProductionRequest(input: UpdateProductionRequestInput!): ProductionRequest
  }
```

</details>

<details>
<summary><strong>Layanan Stok (Stock Service)</strong></summary>

```graphql
  scalar DateTime

  type Query {
    getProductStock(product_id: Int!): Stock
    getFeedbackRequest(feedback_id: Int!): FeedbackRequest
  }

  type Mutation {
    addStock(stock: AddStockInput): Stock
    updateStock(product_id: Int!, stock: UpdateStockInput): Stock
    deleteStock(product_id: Int!): Stock
    requestFeedback(payload: FeedbackRequestInput): FeedbackRequest
  }

  type Stock {
    id: ID!
    product_id: Int!
    quantity: Int!
    reorder_point: Int!
    created_at: DateTime!
    updated_at: DateTime!
    histories: [History!]!
  }

  type History {
    id: ID!
    product_id: Int!
    type: String!
    quantity: Int!
    created_at: DateTime!
    updated_at: DateTime!
    note: String
  }

  type FeedbackRequest {
    id: ID!
    batch_number: Int!
    note: String
    status: FEEDBACKCSTATUS!
    product_id: Int!
    quantity: Int!
    created_at: DateTime
    updated_at: DateTime
  }

  input AddStockInput {
    product_id: Int!
    quantity: Int!
    reorder_point: Int
  }

  input UpdateStockInput {
    quantity: Int!
    reorder_point: Int
    type: String!
    note: String
  }

  enum FEEDBACKCSTATUS {
    PENDING
    COMPLETED
  }

  input FeedbackRequestInput {
    batch_number: Int!
    status: FEEDBACKCSTATUS
    product_id: Int!
    quantity: Int!
    note: String
  }
```

</details>

## Contoh Query dan Mutation GraphQL

Berikut adalah contoh query dan mutation yang bisa langsung Anda gunakan di klien GraphQL seperti Apollo Studio atau Postman untuk berinteraksi dengan setiap layanan.

---

### 1. Layanan Otentikasi (`auth-service`)

Endpoint: `http://localhost:4005/graphql`

<details>
<summary><strong>Mutation: Register User</strong></summary>

Mendaftarkan pengguna baru.

**GraphQL Operation:**
```graphql
mutation RegisterUser($name: String!, $email: String!, $password: String!) {
  register(name: $name, email: $email, password: $password) {
    id
    name
    email
  }
}
```

**Variables:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```
</details>

<details>
<summary><strong>Query: Login User</strong></summary>

Melakukan login dan mendapatkan token JWT.

**GraphQL Operation:**
```graphql
query LoginUser($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      name
      email
    }
  }
}
```

**Variables:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```
</details>

---

### 2. Layanan Produk (`product-service`)

Endpoint: `http://localhost:4001/graphql`

<details>
<summary><strong>Query: Get All Products</strong></summary>

Mengambil daftar semua produk.

**GraphQL Operation:**
```graphql
query GetAllProducts {
  products {
    product_id
    product_name
    description
    base_price
  }
}
```
</details>

<details>
<summary><strong>Query: Get Product by ID</strong></summary>

Mengambil detail produk berdasarkan ID.

**GraphQL Operation:**
```graphql
query GetProductById($productId: ID!) {
  product(product_id: $productId) {
    product_id
    product_name
    description
    base_price
    default_image_url
  }
}
```

**Variables:**
```json
{
  "productId": "1"
}
```
</details>

<details>
<summary><strong>Mutation: Add Product</strong></summary>

Menambahkan produk baru.

**GraphQL Operation:**
```graphql
mutation AddNewProduct($productName: String!, $description: String, $price: Float!, $imageUrl: String) {
  addProduct(product_name: $productName, description: $description, base_price: $price, default_image_url: $imageUrl) {
    product_id
    product_name
  }
}
```

**Variables:**
```json
{
  "productName": "Stylish T-Shirt",
  "description": "A very stylish t-shirt",
  "price": 29.99,
  "imageUrl": "https://i.ibb.co/kg5ynLp/t-shirt.jpg"
}
```
</details>

<details>
<summary><strong>Mutation: Update Product</strong></summary>

Memperbarui data produk yang ada.

**GraphQL Operation:**
```graphql
mutation UpdateExistingProduct($productId: ID!, $productName: String, $price: Float) {
  updateProduct(product_id: $productId, product_name: $productName, base_price: $price) {
    product_id
    product_name
    base_price
  }
}
```

**Variables:**
```json
{
  "productId": "1",
  "productName": "A More Stylish T-Shirt",
  "price": 35.50
}
```
</details>

<details>
<summary><strong>Mutation: Delete Product</strong></summary>

Menghapus produk berdasarkan ID.

**GraphQL Operation:**
```graphql
mutation DeleteExistingProduct($productId: ID!) {
  deleteProduct(product_id: $productId) {
    product_id
  }
}
```

**Variables:**
```json
{
  "productId": "1"
}
```
</details>

---

### 3. Layanan Pesanan (`order-service`)

Endpoint: `http://localhost:4002/graphql`

<details>
<summary><strong>Query: Get Orders by Customer</strong></summary>

Mengambil riwayat pesanan berdasarkan email pelanggan.

**GraphQL Operation:**
```graphql
query GetOrdersByCustomer($email: String!) {
  ordersByCustomer(email: $email) {
    id
    status
    totalPrice
    orderDate
    items {
      productId
      quantity
      price
    }
  }
}
```

**Variables:**
```json
{
  "email": "john.doe@example.com"
}
```
</details>

<details>
<summary><strong>Mutation: Create Order</strong></summary>

Membuat pesanan baru.

**GraphQL Operation:**
```graphql
mutation CreateNewOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    status
    totalPrice
  }
}
```

**Variables:**
```json
{
  "input": {
    "customerEmail": "john.doe@example.com",
    "shippingAddress": "123 Main St, Anytown, USA",
    "paymentMethod": "Credit Card",
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "price": 29.99
      },
      {
        "productId": 2,
        "quantity": 1,
        "price": 49.99
      }
    ]
  }
}
```
</details>

---

### 4. Layanan Stok (`stock-service`)

Endpoint: `http://localhost:4004/graphql`

<details>
<summary><strong>Query: Get Product Stock</strong></summary>

Memeriksa jumlah stok untuk produk tertentu.

**GraphQL Operation:**
```graphql
query GetStock($productId: Int!) {
  getProductStock(product_id: $productId) {
    product_id
    quantity
    reorder_point
  }
}
```

**Variables:**
```json
{
  "productId": 1
}
```
</details>

<details>
<summary><strong>Mutation: Add Stock</strong></summary>

Menambahkan stok baru untuk sebuah produk.

**GraphQL Operation:**
```graphql
mutation AddNewStock($stock: AddStockInput!) {
  addStock(stock: $stock) {
    id
    product_id
    quantity
  }
}
```

**Variables:**
```json
{
  "stock": {
    "product_id": 1,
    "quantity": 100,
    "reorder_point": 20
  }
}
```
</details>

<details>
<summary><strong>Mutation: Update Stock</strong></summary>

Memperbarui stok (misalnya, setelah penjualan atau restock).

**GraphQL Operation:**
```graphql
mutation UpdateExistingStock($productId: Int!, $stock: UpdateStockInput!) {
    updateStock(product_id: $productId, stock: $stock) {
        id
        product_id
        quantity
        reorder_point
    }
}
```

**Variables:**
```json
{
    "productId": 1,
    "stock": {
        "quantity": 50,
        "reorder_point": 15,
        "type": "SALE",
        "note": "Sold 50 units"
    }
}
```
</details>

---

### 5. Layanan Permintaan Produksi (`production-request-service`)

Endpoint: `http://localhost:4003/graphql`

<details>
<summary><strong>Query: Get All Production Requests</strong></summary>

Mengambil semua permintaan produksi.

**GraphQL Operation:**
```graphql
query GetAllRequests {
  allProductionRequests {
    id
    product_id
    quantity
    status
    due_date
  }
}
```
</details>

<details>
<summary><strong>Mutation: Create Production Request</strong></summary>

Membuat permintaan produksi baru.

**GraphQL Operation:**
```graphql
mutation CreateNewRequest($input: CreateInternalProductionRequestInput!) {
  createRequest(input: $input) {
    id
    product_id
    quantity
    status
  }
}
```

**Variables:**
```json
{
  "input": {
    "product_id": 1,
    "quantity": 200,
    "due_date": "2025-12-31"
  }
}
```
</details>

<details>
<summary><strong>Mutation: Update Production Request</strong></summary>

Memperbarui status permintaan produksi, misalnya setelah batch manufaktur ditetapkan.

**GraphQL Operation:**
```graphql
mutation UpdateRequest($input: UpdateProductionRequestInput!) {
    updateProductionRequest(input: $input) {
        id
        status
        manufacture_batch_id
    }
}
```

**Variables:**
```json
{
    "input": {
        "id": "1",
        "manufacturer_batch_id": "BATCH-XYZ-123"
    }
}
```
</details>
