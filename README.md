---

## Troubleshooting

| Problem | Fix |
|---|---|
| Port conflict | Change `PORT` in `.env` or kill the existing process |
| DB connection failed | Check credentials; confirm PostgreSQL is running |
| LLM errors | Verify API key is valid and has quota remaining |
| CORS errors | Confirm `FRONTEND_URL` matches your frontend origin exactly |
| Schema parse error | Ensure uploaded file is valid SQL DDL or JSON |

---

## Roadmap

- [ ] MySQL and SQLite support
- [ ] Query optimization suggestions
- [ ] Team workspaces
- [ ] Scheduled queries
- [ ] Audit logs and query encryption

---

## License

MIT — see [LICENSE](LICENSE)