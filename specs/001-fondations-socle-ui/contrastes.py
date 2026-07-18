def lum(hexs):
    hexs = hexs.lstrip('#')
    r,g,b = [int(hexs[i:i+2],16)/255 for i in (0,2,4)]
    def f(c): return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)

def ratio(a,b):
    la,lb = lum(a),lum(b)
    hi,lo = max(la,lb),min(la,lb)
    return (hi+0.05)/(lo+0.05)

clair = {'paper':'#FFFFFF','surface':'#F5F5F5','ink':'#0A0A0A','muted':'#6F6F6F','line':'#E6E6E6','accent':'#1F35FF'}
sombre = {'paper':'#0B0B0C','surface':'#151517','ink':'#F5F5F5','muted':'#9A9A9A','line':'#262628','accent':'#8A97FF'}

print(f"{'couple':38} {'clair':>7} {'AA txt':>7} {'sombre':>8} {'AA txt':>7}")
print('-'*72)
couples = [('ink','paper'),('ink','surface'),('muted','paper'),('muted','surface'),
           ('accent','paper'),('accent','surface'),('line','paper'),('ink','line'),('accent','ink')]
for fg,bg in couples:
    rc = ratio(clair[fg],clair[bg]); rs = ratio(sombre[fg],sombre[bg])
    ok = lambda r: 'oui' if r>=4.5 else ('3:1' if r>=3 else 'NON')
    print(f"{fg+' sur '+bg:38} {rc:7.2f} {ok(rc):>7} {rs:8.2f} {ok(rs):>7}")
