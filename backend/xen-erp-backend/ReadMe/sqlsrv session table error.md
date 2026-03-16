## Error 
    Internal Server Error
    Copy as Markdown

    Illuminate\Database\QueryException
    SQLSTATE[42S02]: [Microsoft][ODBC Driver 17 for SQL Server][SQL Server]Invalid object name 'sessions'. (Connection: sqlsrv, SQL: select top 1 * from [sessions] where [id] = OOVgjf4UEqfcYVOhQzqyjeNDL7Z3EEmlVIMZDsW6)

## Solution 
change in .env file 
SESSION_DRIVER=database => SESSION_DRIVER=file