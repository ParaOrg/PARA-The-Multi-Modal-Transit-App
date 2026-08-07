import "../styles/Map.css";

export default function InputBox({ handleChatSubmit, chatInput, setChatInput, chatResponse }) {
  return (
    <div className="input-box-container">
<h2 className="input-box-title">Ask AI</h2>
<form onSubmit={handleChatSubmit} className="input-box-form">
    <input 
        type="text"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        placeholder="Ask about routes..."
        className="input-box-input"
    />
    <button type="submit" className="input-box-button">Send</button>
</form>
{chatResponse && (
    <div className="input-box-response">
        <p>{chatResponse}</p>
    </div>
    )}
    </div>
  );
}
