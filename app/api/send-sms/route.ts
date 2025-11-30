import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  console.log("📩 SMS API route hit")

  try {
    const body = await req.json()
    console.log("📩 Request body:", body)

    // Validate required fields
    if (!body.to || !body.body) {
      return NextResponse.json({ error: "Missing required fields: to and body" }, { status: 400 })
    }

    const username = "muhle_surp"
    const password = "cFP6LSTb7hv.4vj"

    // Fixed: Remove the "messages" wrapper - BulkSMS expects direct message object
    const messageData = {
      to: body.to,
      body: body.body,
    }

    console.log("📩 Sending to BulkSMS:", messageData)

    // Use fetch instead of https module
    const response = await fetch("https://api.bulksms.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(username + ":" + password).toString("base64"),
      },
      body: JSON.stringify(messageData),
    })

    console.log("📩 BulkSMS Response Status:", response.status)

    const responseData = await response.text()
    console.log("📩 BulkSMS Response Data:", responseData)

    if (!response.ok) {
      console.error("❌ BulkSMS Error:", response.status, responseData)

      if (response.status === 401) {
        return NextResponse.json({ error: "Unauthorized: Invalid credentials" }, { status: 401 })
      }

      return NextResponse.json(
        {
          error: "Failed to send SMS",
          details: responseData,
          status: response.status,
        },
        { status: response.status },
      )
    }

    // Parse response if it's JSON
    let parsedData
    try {
      parsedData = JSON.parse(responseData)
    } catch (e) {
      parsedData = responseData
    }

    console.log("✅ SMS sent successfully:", parsedData)

    return NextResponse.json({
      success: true,
      message: "SMS sent successfully!",
      data: parsedData,
    })
  } catch (error) {
    console.error("❌ API Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
