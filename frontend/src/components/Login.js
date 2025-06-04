import { login, resetPassword } from "../APIs/auth-api";
import { useNavigate } from "react-router-dom";
import { useState } from 'react';
import { Modal, Button, Form, Container, Row, Col } from 'react-bootstrap';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleCloseForgetPassword = () => {
    setResetSuccess(false)
    setShowModal(false);
  }

  const [loginInfo, setLogin] = useState({
    email: '',
    password: '',
  });

  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await login(loginInfo);
      if (response.status !== 200) {
        alert(response?.data?.message);
      } else {
        sessionStorage.setItem("authToken", response.data.token);
        navigate('/login', { replace: true });
        window.location.reload(); 
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  }

  const handlePasswordReset = async (e) => {
    setSendingEmail(true);
    e.preventDefault();
    try {
      const response = await resetPassword(email);
      const data = await response.json();
      if (response.ok) {
        setResetSuccess(true);
      } else {
        alert("Gửi email đặt lại mật khẩu thất bại");
      }
    } catch (error) {
      alert("Gửi email đặt lại mật khẩu thất bại");
    }
    setSendingEmail(false);
  };

  return (
    <div>
      <Modal show={showModal} onHide={handleCloseForgetPassword} centered>
        <Modal.Header style={{ justifyContent: 'center' }} className="mb-2">
          <Modal.Title>Đặt Lại Mật Khẩu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!resetSuccess ? (
            <Form onSubmit={handlePasswordReset}>
              <Form.Group className="mb-4">
                <Form.Control 
                  type="email" 
                  placeholder="Nhập email của bạn" 
                  required
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>
              <div className="d-flex justify-content-center">
                <Button type="submit" className="mb-2" disabled={sendingEmail}>
                  Gửi liên kết đặt lại mật khẩu
                </Button>
              </div>
            </Form>
          ) : (
            <div className="text-center">
              <p>Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!</p>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Container className="outer-container">
        <Container className="login-container">
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <h2 style={{ color: '#4A4A4A', fontWeight: 'bold', marginBottom: '30px' }}>Trung Tâm Tài Khoản AVNN</h2>
              <h3 style={{ color: '#4A4A4A', marginBottom: '40px' }}>Chào mừng quay trở lại!</h3>
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="email" style={{ marginBottom: '30px' }}>
                  <Form.Control
                    placeholder="Email"
                    type="email"
                    required
                    style={{ height: '50px' }}
                    onChange={e => setLogin({ ...loginInfo, email: e.target.value })}
                  />
                </Form.Group>
                <Form.Group style={{ marginBottom: '6px' }}>
                  <Form.Control
                    placeholder="Mật khẩu"
                    type="password"
                    required
                    style={{ height: '50px' }}
                    onChange={e => setLogin({ ...loginInfo, password: e.target.value })}
                  />
                </Form.Group>

                {/* Quên mật khẩu - nếu cần bật lại
                <div style={{ textAlign: "left", marginBottom: "30px", marginLeft: "8px" }}>
                  <span
                    style={{
                      color: "#A9A9A9",
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontSize: "12px",
                    }}
                    onClick={() => setShowModal(true)}
                  >
                    Quên mật khẩu?
                  </span>
                </div>
                */}

                <Button type="submit" className="mt-3 mb-4 custom-button">
                  ĐĂNG NHẬP
                </Button>
                <div className="mb-2">
                  <a href="/signup" className="account-creation">
                    Tạo tài khoản
                  </a>
                </div>
              </Form>
            </Col>
          </Row>
        </Container>
      </Container>
    </div>
  );
}

export default Login;
