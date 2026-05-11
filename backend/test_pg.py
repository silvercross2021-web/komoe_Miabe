import psycopg2
try:
    conn = psycopg2.connect("postgresql://komoe_user:komoe2026@localhost:5432/komoe_dev")
    print("Connected successfully to PostgreSQL!")
except Exception as e:
    print("Error:", repr(e))
