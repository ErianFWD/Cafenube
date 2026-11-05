import Icon from './Icon.jsx';
export default function PageHeader({
  eyebrow = 'TU CAFETERÍA, EN ORDEN',
  title,
  description,
  action,
  actionLabel,
  actionIcon = 'plus',
}) {
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action && (
        <button className="button primary" onClick={action}>
          <Icon name={actionIcon} size={19} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
