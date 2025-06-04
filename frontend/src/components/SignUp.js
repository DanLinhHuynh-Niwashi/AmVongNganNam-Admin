import { signup } from "../APIs/auth-api";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { Button, Form, Container, Row, Col, Alert } from "react-bootstrap";
import "./Login.css";

function Signup() {
  const [details, setDetails] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({}); // Store field-specific errors
  const [generalError, setGeneralError] = useState(""); // General error message
  const navigate = useNavigate()
  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setGeneralError("");

    if (details.password !== confirmPassword) {
      setErrors({ confirmPassword: "Mật khẩu không khớp." });
      return;
    }

    try {
      await signup(details); // Axios request
      alert("Tạo tài khoản thành công! Hãy đăng nhập nhé.");
      navigate('/login', { replace: true });
      window.location.reload(); 
    } catch (err) {
      const responseErrors = err.response?.data?.errors || [];
      const formattedErrors = {};
      console.log(err.response);
      // If the backend returns multiple field errors
      responseErrors.forEach((error) => {
        formattedErrors[error.field] = error.message;
      });

      // If there's a general error message (not related to a specific field)
      if (err.response?.data?.message) {
        setGeneralError(err.response.data.message);
      }

      setErrors(formattedErrors);
    }
  };

  return (
    <Container className="outer-container">
      <Container className="login-container">
        <Row className="justify-content-center">
          <Col xs={12} md={8} className="text-center">
            <h2 style={{ color: "#4A4A4A", fontWeight: "bold", marginBottom: "30px" }}>
              Trung Tâm Tài Khoản AVNN
            </h2>
            <h3 style={{ color: "#4A4A4A", marginBottom: "40px" }}>Tạo Tài Khoản</h3>

            {/* Thông báo lỗi chung */}
            {generalError && <Alert variant="danger">{generalError}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="name" style={{ marginBottom: "20px" }}>
                <Form.Control
                  placeholder="Tên hiển thị"
                  type="text"
                  required
                  style={{ height: "50px" }}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="email" style={{ marginBottom: "20px" }}>
                <Form.Control
                  placeholder="Email"
                  type="email"
                  required
                  style={{ height: "50px" }}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group style={{ marginBottom: "20px" }}>
                <Form.Control
                  placeholder="Mật khẩu"
                  type="password"
                  required
                  style={{ height: "50px" }}
                  onChange={(e) => setDetails({ ...details, password: e.target.value })}
                  isInvalid={!!errors.password}
                />
                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group style={{ marginBottom: "20px" }}>
                <Form.Control
                  placeholder="Nhập lại mật khẩu"
                  type="password"
                  required
                  style={{ height: "50px" }}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  isInvalid={!!errors.confirmPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.confirmPassword}
                </Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" className="mt-3 mb-4 custom-button">
                TIẾP THEO
              </Button>

              <div className="mb-2 account-creation">
                Đã có tài khoản?{" "}
                <a href="/login" className="account-creation">
                  Đăng nhập
                </a>
              </div>
            </Form>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default Signup;