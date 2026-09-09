import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";

interface Person {
  name: string;
  url: string;
  avatarUrl?: string;
}

// Twelve hues spread around the wheel; a name always lands on the same one.
const HUES = [10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340];

const hueFor = (name: string) => {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 0x7f_ff_ff_ff;
  }
  return HUES[hash % HUES.length] ?? HUES[0];
};

const githubAvatar = (url: string) => {
  const user = /^https:\/\/github\.com\/(?<user>[A-Za-z0-9-]+)\/?$/u.exec(url)?.groups?.user;
  return user ? `https://github.com/${user}.png?size=80` : undefined;
};

export const PersonAvatar = ({ person }: { person: Person }) => {
  const src = person.avatarUrl ?? githubAvatar(person.url);
  return (
    <a href={person.url} target="_blank" rel="noreferrer" title={person.name}>
      <Avatar>
        {src && <AvatarImage src={src} alt={person.name} />}
        <AvatarFallback
          className="text-background text-xs font-medium"
          style={{ backgroundColor: `oklch(0.7 0.14 ${hueFor(person.name)})` }}
        >
          {person.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    </a>
  );
};
