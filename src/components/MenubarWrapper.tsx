import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
} from "@/components/ui/menubar"

interface MenubarWrapperProps {
  items: {
    label: string;
    items: { label: string; onClick: () => void }[];
  }[];
}

export function MenubarWrapper({ items }: MenubarWrapperProps) {
  return (
    <Menubar>
      {items.map((menu) => (
        <MenubarMenu key={menu.label}>
          <MenubarTrigger>{menu.label}</MenubarTrigger>
          <MenubarContent>
            {menu.items.map((item) => (
              <MenubarItem key={item.label} onClick={item.onClick}>
                {item.label}
              </MenubarItem>
            ))}
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  );
}