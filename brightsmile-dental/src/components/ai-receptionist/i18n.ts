/**
 * Chat widget copy. To add a language: add it to `Locale` in src/lib/receptionist/protocol.ts,
 * add a dictionary here, and teach server/receptionist/language.ts to detect it.
 */
import type { Locale } from "../../lib/receptionist/protocol";

export type QuickActionId = "book" | "pain" | "treatments" | "emergency" | "reception";

type Strings = {
  launcher: string;
  launcherShort: string;
  title: string;
  userLabel: string;
  status: string;
  greeting: string;
  minimize: string;
  restart: string;
  inputLabel: string;
  placeholder: string;
  send: string;
  charactersLeft: (count: number) => string;
  privacy: string;
  typing: string;
  quickActionsLabel: string;
  quickActions: { id: QuickActionId; label: string; message: string }[];
  fallback: string;
  rateLimited: string;
  retry: string;
  opensNewTab: string;
  summary: {
    title: string;
    name: string;
    contact: string;
    service: string;
    date: string;
    time: string;
    patient: string;
    patientType: { new: string; existing: string };
    notes: string;
    confirm: string;
    edit: string;
    editMessage: string;
    note: string;
    readyTitle: string;
    send: string;
    sentTitle: string;
    sendAgain: string;
  };
  sentMessage: string;
  whatsappError: string;
  contact: {
    title: string;
    call: string;
    whatsapp: string;
    email: string;
    hours: string;
  };
  emergency: { title: string; call112: string; callClinic: string };
  hoursDays: Record<string, string>;
};

export const uiStrings: Record<Locale, Strings> = {
  en: {
    launcher: "Ask BrightSmile AI",
    launcherShort: "Ask AI",
    title: "BrightSmile Assistant",
    userLabel: "You",
    status: "Virtual Receptionist",
    greeting:
      "Hi 👋 I’m BrightSmile’s virtual receptionist. I can help you explore treatments, answer clinic questions, and request an appointment. How can I help today?",
    minimize: "Minimise chat",
    restart: "Start a new conversation",
    inputLabel: "Message BrightSmile Assistant",
    placeholder: "Type your message…",
    send: "Send message",
    charactersLeft: (count) => `${count} characters left`,
    privacy:
      "Please avoid sharing sensitive medical information. For diagnosis or treatment advice, speak with a dental professional.",
    typing: "BrightSmile Assistant is typing",
    quickActionsLabel: "Suggested topics",
    quickActions: [
      { id: "book", label: "Book an appointment", message: "I'd like to book an appointment." },
      { id: "pain", label: "I have tooth pain", message: "I have tooth pain." },
      { id: "treatments", label: "Explore treatments", message: "Which treatments do you offer?" },
      { id: "emergency", label: "Emergency help", message: "I need urgent dental help." },
      { id: "reception", label: "Contact reception", message: "I'd like to contact reception." },
    ],
    fallback:
      "Sorry, the virtual receptionist is temporarily unavailable. You can still contact the BrightSmile team directly.",
    rateLimited: "You're sending messages a little quickly. Please wait a moment and try again, or contact the team directly.",
    retry: "Try again",
    opensNewTab: "(opens in a new tab)",
    summary: {
      title: "Your appointment request",
      name: "Name",
      contact: "Contact",
      service: "Service",
      date: "Preferred date",
      time: "Preferred time",
      patient: "Patient",
      patientType: { new: "New patient", existing: "Existing patient" },
      notes: "Notes",
      confirm: "Confirm & send on WhatsApp",
      edit: "Change details",
      editMessage: "I'd like to change some details.",
      note: "This is a request, not a confirmed booking. Reception will reply to confirm a time.",
      readyTitle: "Your appointment request is ready to send to reception.",
      send: "Send on WhatsApp",
      sentTitle: "Request prepared for reception",
      sendAgain: "Open WhatsApp again",
    },
    sentMessage:
      "I’ve prepared your request for the BrightSmile team. WhatsApp should now be open with your details: press Send there to deliver it. Your appointment isn’t confirmed until reception replies.",
    whatsappError: "Sorry, I couldn’t prepare the WhatsApp message. Please contact reception directly.",
    contact: {
      title: "BrightSmile reception",
      call: "Call",
      whatsapp: "WhatsApp",
      email: "Email",
      hours: "Opening hours",
    },
    emergency: { title: "Urgent medical help", call112: "Call 112", callClinic: "Call BrightSmile" },
    hoursDays: {},
  },
  pt: {
    launcher: "Pergunte à BrightSmile IA",
    launcherShort: "Assistente",
    title: "Assistente BrightSmile",
    userLabel: "A sua mensagem",
    status: "Rececionista virtual",
    greeting:
      "Olá 👋 Sou a rececionista virtual da BrightSmile. Posso ajudar a conhecer os tratamentos, responder a questões sobre a clínica e pedir uma consulta. Como posso ajudar hoje?",
    minimize: "Minimizar conversa",
    restart: "Começar nova conversa",
    inputLabel: "Mensagem para o Assistente BrightSmile",
    placeholder: "Escreva a sua mensagem…",
    send: "Enviar mensagem",
    charactersLeft: (count) => `${count} caracteres restantes`,
    privacy:
      "Evite partilhar informação médica sensível. Para diagnóstico ou aconselhamento de tratamento, fale com um profissional de medicina dentária.",
    typing: "O Assistente BrightSmile está a escrever",
    quickActionsLabel: "Temas sugeridos",
    quickActions: [
      { id: "book", label: "Marcar consulta", message: "Gostaria de marcar uma consulta." },
      { id: "pain", label: "Tenho dor de dentes", message: "Tenho dor de dentes." },
      { id: "treatments", label: "Ver tratamentos", message: "Que tratamentos oferecem?" },
      { id: "emergency", label: "Ajuda urgente", message: "Preciso de ajuda dentária urgente." },
      { id: "reception", label: "Contactar a receção", message: "Quero falar com a receção." },
    ],
    fallback:
      "Lamentamos, a rececionista virtual está temporariamente indisponível. Pode contactar diretamente a equipa BrightSmile.",
    rateLimited: "Está a enviar mensagens muito depressa. Aguarde um momento e tente novamente, ou contacte a equipa diretamente.",
    retry: "Tentar novamente",
    opensNewTab: "(abre num novo separador)",
    summary: {
      title: "O seu pedido de consulta",
      name: "Nome",
      contact: "Contacto",
      service: "Serviço",
      date: "Data preferida",
      time: "Hora preferida",
      patient: "Paciente",
      patientType: { new: "Novo paciente", existing: "Paciente existente" },
      notes: "Notas",
      confirm: "Confirmar e enviar por WhatsApp",
      edit: "Alterar dados",
      editMessage: "Gostaria de alterar alguns dados.",
      note: "Isto é um pedido, não uma marcação confirmada. A receção responde para confirmar o horário.",
      readyTitle: "O seu pedido de consulta está pronto para enviar à receção.",
      send: "Enviar por WhatsApp",
      sentTitle: "Pedido preparado para a receção",
      sendAgain: "Abrir o WhatsApp novamente",
    },
    sentMessage:
      "Preparei o seu pedido para a equipa BrightSmile. O WhatsApp deve estar aberto com os seus dados: carregue em Enviar para o entregar. A consulta só fica confirmada quando a receção responder.",
    whatsappError: "Lamento, não consegui preparar a mensagem de WhatsApp. Por favor contacte a receção diretamente.",
    contact: {
      title: "Receção BrightSmile",
      call: "Ligar",
      whatsapp: "WhatsApp",
      email: "Email",
      hours: "Horário",
    },
    emergency: { title: "Ajuda médica urgente", call112: "Ligar 112", callClinic: "Ligar à BrightSmile" },
    hoursDays: {
      "Monday – Friday": "Segunda – Sexta",
      Saturday: "Sábado",
      Sunday: "Domingo",
      Closed: "Fechado",
    },
  },
};
