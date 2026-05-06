---
name: cancel_service_refund
description: Tạo phiếu hoàn dịch vụ hoặc sản phẩm cho khách hàng (lý do hoàn, số tiền hoàn, phương thức thanh toán hoàn). Dùng khi khách hủy liệu trình, trả sản phẩm, hoàn gói dịch vụ chưa dùng hết.
triggers:
  - "hoàn tiền"
  - "hủy dịch vụ"
  - "hoàn dịch vụ"
  - "trả hàng"
  - "refund"
  - "hoàn gói"
  - "hoàn liệu trình"
  - "khách hủy"
  - "tạo phiếu hoàn"
  - "cancel dịch vụ"
  - "hoàn sản phẩm"
endpoint: POST /internal/skills/cancel_service_refund
---

# Skill: cancel_service_refund

## Khi nào dùng
- Khách hàng muốn hủy liệu trình còn dư buổi và yêu cầu hoàn tiền
- Khách trả lại sản phẩm (chưa mở, lỗi nhà sản xuất, không phù hợp)
- Hủy gói combo/bundle chưa sử dụng hoặc đã sử dụng một phần
- User nói "khách hủy", "hoàn tiền", "trả dịch vụ", "refund cho KH"
- KHÔNG dùng cho ghi thu/chi thông thường → dùng `create_cashbook_entry`
- Luôn xác nhận lý do và số tiền hoàn với user trước khi tạo phiếu

## Cách dùng
1. `refund_type`: phân biệt loại hoàn — `treatment` (liệu trình), `product` (sản phẩm), `bundle` (gói combo), `service` (dịch vụ lẻ)
2. `reference_id`: UUID của liệu trình/đơn hàng/gói cần hoàn (bắt buộc)
3. `refund_amount`: số tiền hoàn thực tế — có thể nhỏ hơn số tiền gốc nếu đã dùng một phần
4. `refund_method`: phương thức hoàn tiền (CASH, TRANSFER, CARD, SERVICE_CREDIT)
5. `reason`: lý do hoàn — bắt buộc để lưu vết audit
6. Với hoàn liệu trình: hệ thống tự tính số buổi đã dùng và đề xuất số tiền hoàn còn lại

## Ví dụ

User: "Hoàn tiền liệu trình id tr-abc123 cho khách, còn 4 buổi chưa dùng, hoàn 800k tiền mặt, lý do: khách chuyển nơi ở"
→ `{"refund_type": "treatment", "reference_id": "tr-abc123", "refund_amount": 800000, "refund_method": "CASH", "reason": "Khách chuyển nơi ở"}`

User: "Khách trả lại kem dưỡng ẩm X (đơn hàng id: ord-xyz), hoàn 250k chuyển khoản, lý do: sản phẩm lỗi"
→ `{"refund_type": "product", "reference_id": "ord-xyz", "product_ids": ["uuid-kem-duong"], "refund_amount": 250000, "refund_method": "TRANSFER", "reason": "Sản phẩm lỗi từ nhà sản xuất"}`

User: "Hủy gói combo id bun-456, hoàn vào credit tài khoản khách 1.5tr, khách không hài lòng"
→ `{"refund_type": "bundle", "reference_id": "bun-456", "refund_amount": 1500000, "refund_method": "SERVICE_CREDIT", "reason": "Khách không hài lòng với dịch vụ"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "refund_id": "uuid",
    "refund_type": "treatment",
    "reference_id": "tr-abc123",
    "refund_amount": 800000,
    "refund_method": "CASH",
    "reason": "Khách chuyển nơi ở",
    "status": "COMPLETED",
    "sessions_cancelled": 4,
    "processed_by": "uuid-staff",
    "created_at": "2026-04-22T10:30:00Z",
    "cashbook_entry_id": "uuid-entry"
  }
}
```

## Lỗi thường gặp
- `REFERENCE_NOT_FOUND`: ID liệu trình/đơn hàng không tồn tại — kiểm tra lại với `search_treatments` hoặc `get_treatment_progress`
- `REFUND_AMOUNT_EXCEEDS_MAX`: Số tiền hoàn vượt quá giá trị có thể hoàn — hỏi user xác nhận lại
- `TREATMENT_ALREADY_COMPLETED`: Liệu trình đã hoàn thành, không thể hủy — chỉ có thể ghi phiếu chi hoàn tiền thủ công
- `ALREADY_REFUNDED`: Phiếu hoàn đã được xử lý trước đó
- `REASON_REQUIRED`: Lý do hoàn là bắt buộc — hỏi user lý do trước khi tạo phiếu
