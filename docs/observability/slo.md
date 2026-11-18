# SLOs and alerts (SCRUM-128)

## Service level objectives
| Service | Availability | p95 latency | Error rate |
| --- | --- | --- | --- |
| gateway | 99.5% | 300 ms | < 1% |
| identity | 99.5% | 200 ms | < 1% |
| campus | 99% | 500 ms | < 2% |
| engagement | 99% | 500 ms | < 2% |
| cafeteria | 99% | 500 ms | < 2% |
| notifications | 99% | 300 ms | < 1% |
| ai | 95% (degradable) | 2 s | < 5% |

## Alerts (Prometheus)
See `alerts.yaml` in this folder. Alerts fire on:
- service down (up == 0 for 2m)
- high error rate (> 5% for 5m)
- high latency (p95 > 1s for 5m)
- AI daily token budget exceeded
