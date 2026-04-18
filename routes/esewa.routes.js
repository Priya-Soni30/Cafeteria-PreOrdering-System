import express from "express";
import crypto from "crypto";

const router = express.Router();

const ESEWA_PRODUCT_CODE = String(process.env.ESEWA_PRODUCT_CODE || "EPAYTEST").trim();
const ESEWA_SECRET_KEY = String(process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q").trim();
const ESEWA_FORM_URL = String(
  process.env.ESEWA_FORM_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
).trim();
const ESEWA_STATUS_URL = String(
  process.env.ESEWA_STATUS_URL || "https://rc.esewa.com.np/api/epay/transaction/status/"
).trim();

function signEsewa(totalAmount, transactionUuid, productCode) {
  const message = `total_amount=${Number(totalAmount)},transaction_uuid=${transactionUuid},product_code=${productCode}`;

  return crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
}

function isValidAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

router.get("/config", (req, res) => {
  return res.json({
    success: true,
    productCode: ESEWA_PRODUCT_CODE,
    formUrl: ESEWA_FORM_URL,
    statusUrl: ESEWA_STATUS_URL,
  });
});

router.post("/sign", (req, res) => {
  try {
    const { totalAmount, transactionUuid } = req.body;

    const cleanUuid = String(transactionUuid || "").trim();

    if (!cleanUuid || !isValidAmount(totalAmount)) {
      return res.status(400).json({
        success: false,
        message: "Valid totalAmount and transactionUuid are required.",
      });
    }

    const signature = signEsewa(totalAmount, cleanUuid, ESEWA_PRODUCT_CODE);

    return res.status(200).json({
      success: true,
      formUrl: ESEWA_FORM_URL,
      productCode: ESEWA_PRODUCT_CODE,
      signature,
      signedFieldNames: "total_amount,transaction_uuid,product_code",
    });
  } catch (error) {
    console.error("❌ eSewa sign error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to sign eSewa payment request.",
      error: error.message,
    });
  }
});

router.get("/verify", async (req, res) => {
  try {
    const { transaction_uuid, total_amount } = req.query;

    const cleanUuid = String(transaction_uuid || "").trim();

    if (!cleanUuid || !isValidAmount(total_amount)) {
      return res.status(400).json({
        success: false,
        message: "Valid transaction_uuid and total_amount are required.",
      });
    }

    const query = new URLSearchParams({
      product_code: ESEWA_PRODUCT_CODE,
      total_amount: String(Number(total_amount)),
      transaction_uuid: cleanUuid,
    });

    const response = await fetch(`${ESEWA_STATUS_URL}?${query.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    return res.status(200).json({
      success: response.ok,
      statusCode: response.status,
      data,
    });
  } catch (error) {
    console.error("❌ eSewa verify error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify eSewa transaction.",
      error: error.message,
    });
  }
});

export default router;