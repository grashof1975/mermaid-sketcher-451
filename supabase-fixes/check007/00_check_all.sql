-- Controlla l'esistenza e il tipo della colonna 'id' nelle tabelle chiave.
-- Se lo script APPLY_007 è stato applicato, questa query dovrebbe restituire 3 righe,
-- una per ogni tabella, mostrando che tutte hanno una colonna 'id'.

SELECT
    table_name,
    column_name,
    data_type
FROM
    information_schema.columns
WHERE
    table_name IN ('saved_views', 'user_tag_filters', 'tag_statistics')
    AND column_name = 'id'
    AND table_schema = 'public'
ORDER BY
    table_name;
