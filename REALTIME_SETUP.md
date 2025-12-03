# 🔄 Realtime Setup - SQL Megoldás

Ha nem találod a **Database → Replication** menüt a Supabase Dashboard-on, használd ezt az SQL megoldást!

---

## 🚀 Gyors Megoldás (1 perc)

### Opció 1: Teljes Schema Futtatása (Ajánlott)

Futtasd a teljes extended schema-t, ami már tartalmazza a realtime engedélyezést:

```sql
-- Supabase Dashboard → SQL Editor → New query
-- Másold be és futtasd: supabase/schema_extended.sql
```

Ez létrehozza:
- ✅ Összes táblát (matches, likes, passes, messages)
- ✅ Összes indexet
- ✅ RLS policy-kat
- ✅ **Realtime engedélyezést a messages táblára**

### Opció 2: Csak Realtime Engedélyezése

Ha már futott a schema, és csak a realtime-ot szeretnéd engedélyezni:

```sql
-- Supabase Dashboard → SQL Editor → New query
-- Másold be és futtasd: supabase/enable-realtime.sql
```

---

## 📝 SQL Kód (Manuális)

Ha közvetlenül szeretnéd beilleszteni:

```sql
-- 1. Ellenőrizd, hogy létezik-e a supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- 2. Add hozzá a messages táblát
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 3. Ellenőrzés
SELECT 
  schemaname,
  tablename,
  'Realtime enabled ✅' as status
FROM 
  pg_publication_tables
WHERE 
  pubname = 'supabase_realtime'
  AND tablename = 'messages';
```

---

## ✅ Ellenőrzés

### SQL-lel

Futtasd ezt a query-t:

```sql
SELECT 
  schemaname,
  tablename
FROM 
  pg_publication_tables
WHERE 
  pubname = 'supabase_realtime';
```

**Eredmény:**
```
schemaname | tablename
-----------+-----------
public     | messages
```

Ha látod a `messages` táblát, akkor **sikeres**! ✅

### Node.js Script-tel

```bash
node scripts/test-supabase-connection.js
```

Ez ellenőrzi az összes beállítást.

---

## 🐛 Hibaelhárítás

### Hiba: "publication already exists"

**Megoldás:**
```sql
-- Töröld és hozd létre újra
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

### Hiba: "relation does not exist"

**Ok:** A messages tábla még nem létezik.

**Megoldás:**
```sql
-- Futtasd először a teljes schema-t
-- supabase/schema_extended.sql
```

### Hiba: "permission denied"

**Ok:** Nincs jogosultságod a publication módosításához.

**Megoldás:**
- Ellenőrizd, hogy admin jogosultsággal vagy-e bejelentkezve
- Használd a Supabase Dashboard SQL Editor-t (nem külső client)

---

## 🎯 Következő Lépések

1. ✅ Futtasd az SQL-t
2. ✅ Ellenőrizd az eredményt
3. ✅ Teszteld az appot:
   ```bash
   npm run reset
   ```
4. ✅ Nyiss meg egy chat-et és küldj üzenetet
5. ✅ Ellenőrizd, hogy real-time működik (2 eszköz)

---

## 📚 További Információ

- **Supabase Realtime Docs:** https://supabase.com/docs/guides/realtime
- **PostgreSQL Publications:** https://www.postgresql.org/docs/current/sql-createpublication.html

---

**Készítette:** Kiro AI  
**Verzió:** 1.0.0
