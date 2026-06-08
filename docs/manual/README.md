# docs/manual — 사용 매뉴얼

이 폴더는 Harness Core 사용 매뉴얼을 담는다.

## 구성
| 파일 | 내용 |
|---|---|
| `harness-core-manual-v0.6.0.pdf` | **배포용 완성본 PDF** — 여기에 넣으세요 (파일명에 버전 표기) |
| `walkthrough.md` | 실전 워크스루 — `/init`부터 첫 컴포넌트까지 "무엇이 나오고/어떻게 돌고/왜 하는지" |
| `pdf-update-spec.md` | PDF 버전 올릴 때 변경 명세 (양식 유지하며 반영하는 목록) |

## 규칙
- **PDF**: 파일명에 버전 박기 (`harness-core-manual-v0.6.0.pdf`). 배포용 완성본.
- **md 소스**: 버전 없이 최신 유지(`walkthrough.md` 등). Claude가 읽고 갱신 가능.
- 버전 올릴 때: `pdf-update-spec.md`의 변경 목록을 원본 디자인 도구에서 반영 → 재출력.

> PDF는 커스텀 디자인 소스로 만들어지므로, 코드로 자동 재생성하지 않고
> 위 명세를 보고 **원본 도구에서** 갱신한다 (양식 안 깨지게).
