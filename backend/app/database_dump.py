import sqlite3
import json

def dump_data():
    conn = sqlite3.connect('rapor_tk.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    for table in ['users', 'students', 'daily_reports', 'assessments', 'gallery', 'evaluations']:
        print(f"=== TABLE: {table} ===")
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            for r in rows:
                print(dict(r))
        except Exception as e:
            print(f"Error: {e}")
        print()
    conn.close()

if __name__ == '__main__':
    dump_data()
