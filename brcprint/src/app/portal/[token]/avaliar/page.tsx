"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

export default function SubmitReviewPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<any>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else if (data.status !== 'delivered') {
          setError("Este pedido ainda não foi entregue.");
        } else {
          setQuote(data);
        }
        setLoading(false);
      })
      .catch(() => { setError("Erro ao carregar dados do pedido."); setLoading(false); });
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("rating", rating.toString());
      formData.append("comment", comment);
      if (photo) {
        formData.append("photo", photo);
      }

      const res = await fetch(`/api/portal/${token}/review`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        alert(data.error || "Erro ao enviar avaliação.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de comunicação com o servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "4rem" }}>Carregando...</div>;

  if (error) return (
    <div style={{ maxWidth: 500, margin: "4rem auto", textAlign: "center" }}>
      <h2>⚠️ Opa!</h2>
      <p>{error}</p>
      <button onClick={() => router.push(`/portal/${token}`)} className="btn btn-ghost" style={{ marginTop: "1rem" }}>
        Voltar para o Portal
      </button>
    </div>
  );

  if (success) return (
    <div style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center", padding: "2rem", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✨</div>
      <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Muito Obrigado!</h2>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Sua avaliação foi enviada com sucesso. Ficamos felizes em participar do seu projeto!
      </p>
      <button onClick={() => router.push(`/portal/${token}`)} className="btn" style={{ background: "var(--accent)", color: "white", padding: "1rem 2rem", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: 600 }}>
        Visualizar Cotação
      </button>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: "3rem auto", padding: "0 1rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.5rem" }}>Avalie seu Pedido</h1>
        <p style={{ color: "var(--muted)" }}>Como foi a sua experiência com a impressão da peça <strong>{quote.title}</strong>?</p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>

        {/* Rating Stars */}
        <div style={{ textAlign: "center" }}>
          <label style={{ display: "block", fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
            Sua Nota Oficial
          </label>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "3rem",
                  color: star <= (hoverRating || rating) ? "#fbbf24" : "var(--border)",
                  transition: "color 0.2s, transform 0.1s",
                  transform: star <= (hoverRating || rating) ? "scale(1.1)" : "scale(1)"
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Deixe um comentário (opcional)
          </label>
          <textarea
            className="input"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="O que você mais gostou no resultado final?"
            style={{ width: "100%", padding: "1rem", borderRadius: "12px", border: "2px solid var(--border)", background: "var(--surface2)", resize: "vertical" }}
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Adicione uma foto da peça pronta (opcional)
          </label>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {!photoPreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border)",
                borderRadius: "12px",
                padding: "2rem",
                textAlign: "center",
                cursor: "pointer",
                background: "var(--surface2)",
                transition: "border-color 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
              <div style={{ fontWeight: 600, color: "var(--text)" }}>Clique para fazer upload da foto</div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>PNG, JPG até 5MB</div>
            </div>
          ) : (
            <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "2px solid var(--border)" }}>
              <img src={photoPreview} alt="Preview" style={{ width: "100%", maxHeight: "300px", objectFit: "cover", display: "block" }} />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(""); }}
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold"
                }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="btn"
          style={{
            width: "100%",
            padding: "1.25rem",
            borderRadius: "12px",
            fontSize: "1.1rem",
            fontWeight: 800,
            background: "var(--accent)",
            color: "white",
            border: "none",
            cursor: submitting || rating === 0 ? "not-allowed" : "pointer",
            opacity: submitting || rating === 0 ? 0.6 : 1,
            transition: "opacity 0.2s"
          }}
        >
          {submitting ? "Enviando..." : "Enviar Avaliação"}
        </button>
      </form>
    </div>
  );
}
