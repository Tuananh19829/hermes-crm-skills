---
name: manage_print_settings
description: Cấu hình mẫu in hóa đơn (logo, tên cơ sở, footer, font, barcode)
triggers:
  - "mẫu in"
  - "in hóa đơn"
  - "print settings"
  - "cấu hình in"
  - "logo hóa đơn"
  - "footer hóa đơn"
  - "barcode"
  - "mẫu bill"
  - "in bill"
endpoint: POST /internal/skills/manage_print_settings
---

# Skill: manage_print_settings

## Khi nào dùng
- User muốn xem cấu hình in hóa đơn hiện tại
- User muốn thay đổi logo, tên cơ sở, số điện thoại hiển thị trên bill
- User muốn thêm/sửa nội dung footer (lời cảm ơn, chính sách đổi trả...)
- User muốn bật/tắt barcode hoặc QR code trên hóa đơn
- User muốn chọn font chữ hoặc kích thước giấy in

## Cách dùng
- `action: "get"` — Xem cấu hình in hiện tại
- `action: "update"` — Cập nhật một hoặc nhiều trường cấu hình
- `action: "preview"` — Sinh link xem trước hóa đơn mẫu
- Các trường có thể cập nhật: `logo_url`, `header_name`, `header_phone`, `header_address`, `footer_text`, `show_barcode`, `show_qr`, `paper_size`, `font_size`
- `paper_size` hợp lệ: `"A4"`, `"K80"` (khổ 80mm nhiệt), `"K57"` (khổ 57mm)

## Ví dụ
User: "Xem cấu hình in hóa đơn hiện tại"
→ `{"action": "get"}`

User: "Đổi footer thành 'Cảm ơn quý khách, hẹn gặp lại!'"
→ `{"action": "update", "footer_text": "Cảm ơn quý khách, hẹn gặp lại!"}`

User: "Bật barcode trên hóa đơn và đổi khổ giấy sang K80"
→ `{"action": "update", "show_barcode": true, "paper_size": "K80"}`

User: "Xem trước mẫu hóa đơn"
→ `{"action": "preview"}`

## Output format
```json
{
  "ok": true,
  "action": "get",
  "data": {
    "logo_url": "https://cdn.spaclaw.pro/logo.png",
    "header_name": "Spaclaw Beauty & Spa",
    "header_phone": "028 3333 4444",
    "header_address": "123 Nguyễn Trãi, Q.1, TP.HCM",
    "footer_text": "Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ. Hẹn gặp lại!",
    "show_barcode": true,
    "show_qr": true,
    "paper_size": "K80",
    "font_size": "medium",
    "updated_at": "2026-04-20T10:00:00Z"
  }
}
```

Khi preview:
```json
{
  "ok": true,
  "action": "preview",
  "data": {
    "preview_url": "https://crm.spaclaw.pro/api/print/preview?token=eyJhb...",
    "expires_in": 300
  }
}
```

Khi update thành công:
```json
{
  "ok": true,
  "action": "update",
  "updated_fields": ["footer_text", "show_barcode", "paper_size"],
  "message": "Đã cập nhật cấu hình in hóa đơn"
}
```

## Lỗi thường gặp
- `INVALID_PAPER_SIZE`: Khổ giấy không hợp lệ → nhắc dùng A4, K80, hoặc K57
- `LOGO_URL_UNREACHABLE`: URL logo không truy cập được → yêu cầu upload lại
- `FOOTER_TOO_LONG`: Footer vượt quá 200 ký tự → yêu cầu rút gọn
- `INVALID_FONT_SIZE`: font_size phải là `small`, `medium`, hoặc `large`
- `PERMISSION_DENIED`: Chỉ OWNER/ADMIN mới được thay đổi cấu hình in
